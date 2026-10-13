"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function createScreen() {
  function element() {
    const classes = new Set();
    const listeners = new Map();
    const node = {
      children: [], dataset: {}, attributes: {}, value: "", textContent: "", disabled: false, hidden: false, open: false,
      append(...items) { this.children.push(...items); },
      replaceChildren(...items) { this.children = items; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(type, handler, options) {
        const group = listeners.get(type) || { capture: [], bubble: [] };
        group[options === true || options?.capture ? "capture" : "bubble"].push(handler);
        listeners.set(type, group);
      },
      dispatch(type, extras = {}) {
        const event = {
          currentTarget: this, target: extras.target || this, defaultPrevented: false, stopped: false,
          preventDefault() { this.defaultPrevented = true; },
          stopImmediatePropagation() { this.stopped = true; },
        };
        const group = listeners.get(type) || { capture: [], bubble: [] };
        for (const handler of [...group.capture, ...group.bubble]) {
          if (event.stopped) break;
          handler(event);
        }
        return event;
      },
      showModal() { this.open = true; },
      close() { this.open = false; this.dispatch("close"); },
      focus() { this.dispatch("focus"); },
      requestSubmit() { this.dispatch("submit"); },
    };
    Object.defineProperty(node, "className", {
      get() { return [...classes].join(" "); },
      set(value) { classes.clear(); String(value).split(/\s+/).filter(Boolean).forEach((name) => classes.add(name)); },
    });
    node.classList = {
      add(name) { classes.add(name); }, remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
      toggle(name, force) { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); },
    };
    return node;
  }

  const ids = [
    "product-list", "cart-items", "order-count", "order-total", "step-browse", "step-order", "step-payment", "step-receipt",
    "cart-message", "payment-form", "cash-amount", "payment-message", "pay-button", "new-transaction", "receipt-content",
    "welcome-screen", "loading-screen", "app-shell", "confirm-dialog", "receipt-dialog", "theme-toggle",
    "theme-label", "begin-button", "confirm-total", "confirm-cash", "confirm-change",
    "confirm-cancel", "confirm-accept", "print-animation", "print-receipt",
  ];
  const roots = Object.fromEntries(ids.map((id) => [`#${id}`, element()]));
  roots["#loading-screen"].hidden = true;
  roots["#new-transaction"].disabled = true;
  const body = element();
  body.classList.add("is-landing");
  const document = {
    body, documentElement: element(),
    querySelector(selector) { return roots[selector] || null; },
    createElement: element, createDocumentFragment: element,
  };
  const observers = [];
  class MutationObserver {
    constructor(callback) { this.callback = callback; }
    observe(target) { observers.push({ target, callback: this.callback }); }
  }
  let nextTimer = 0;
  const timers = [];
  const window = {
    printCount: 0,
    setTimeout(callback, delay) { const timer = { id: ++nextTimer, callback, delay, canceled: false }; timers.push(timer); return timer.id; },
    clearTimeout(id) { const timer = timers.find((entry) => entry.id === id); if (timer) timer.canceled = true; },
    print() { this.printCount += 1; },
  };
  const localStorage = { getItem() { return null; }, setItem() {} };
  const context = vm.createContext({ document, window, localStorage, MutationObserver });
  for (const file of ["app.js", "experience.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
  }

  function click(selector, dataset) {
    const target = dataset ? { closest: () => ({ dataset }) } : roots[selector];
    roots[selector].dispatch("click", { target });
  }
  function type(value) { roots["#cash-amount"].value = value; roots["#cash-amount"].dispatch("input"); }
  function notify(selector) { for (const observer of observers) if (observer.target === roots[selector]) observer.callback(); }
  function runNextTimer() { const timer = timers.shift(); if (timer && !timer.canceled) timer.callback(); return timer?.delay; }
  function visibleText(node) { return [node.textContent || "", ...node.children.map(visibleText)].join(" "); }
  return { roots, body, window, click, type, notify, runNextTimer, visibleText };
}

test("Begin shows the animated cooking loader before the workspace opens", () => {
  const app = createScreen();
  app.click("#theme-toggle");
  assert.equal(app.roots["#theme-label"].textContent, "Light mode");
  app.click("#begin-button");
  assert.equal(app.runNextTimer(), 430);
  assert.equal(app.roots["#loading-screen"].hidden, false);
  assert.equal(app.body.classList.contains("is-loading"), true);
  assert.equal(app.runNextTimer(), 2500);
  assert.equal(app.body.classList.contains("is-loading"), false);
  assert.equal(app.runNextTimer(), 430);
  assert.equal(app.roots["#loading-screen"].hidden, true);
});

test("cash errors update inline while confirmation and receipt use dialogs", () => {
  const app = createScreen();
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.ok(html.indexOf('id="payment-message"') > html.indexOf('class="cash-field"'));
  assert.ok(html.indexOf('id="payment-message"') < html.indexOf('class="field-hint"'));
  assert.ok(!html.includes('id="error-dialog"'));
  app.click("#product-list", { productId: "2" });
  app.click("#product-list", { productId: "2" });
  app.click("#product-list", { productId: "1" });
  app.click("#product-list", { productId: "5" });
  app.type("");
  assert.match(app.roots["#payment-message"].textContent, /enter the cash received/);
  app.type("adasd");
  assert.match(app.roots["#payment-message"].textContent, /valid number/);
  app.type("-50");
  assert.match(app.roots["#payment-message"].textContent, /negative/);
  app.type("100");
  assert.match(app.roots["#payment-message"].textContent, /Insufficient payment/);
  assert.equal(app.roots["#pay-button"].disabled, true);
  app.type("200");
  assert.equal(app.roots["#payment-message"].textContent, "");
  assert.equal(app.roots["#pay-button"].disabled, false);
  app.roots["#payment-form"].requestSubmit();
  assert.equal(app.roots["#confirm-dialog"].open, true);
  assert.equal(app.roots["#confirm-change"].textContent, "₱35.00");
  assert.equal(app.roots["#receipt-content"].classList.contains("receipt-paper"), false);
  app.click("#confirm-accept");
  app.notify("#receipt-content");
  assert.equal(app.roots["#receipt-dialog"].open, true);
  assert.match(app.visibleText(app.roots["#receipt-content"]), /₱35.00/);
  app.click("#print-receipt");
  assert.equal(app.roots["#print-animation"].hidden, false);
  assert.equal(app.runNextTimer(), 1450);
  assert.equal(app.window.printCount, 1);
  app.click("#new-transaction");
  assert.equal(app.roots["#receipt-dialog"].open, false);
  assert.equal(app.roots["#order-total"].textContent, "₱0.00");
});
