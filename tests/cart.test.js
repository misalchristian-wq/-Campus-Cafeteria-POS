"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

// Load the browser script without a DOM so its pure cart functions can be checked.
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"), context);
const { PRODUCTS, addToCart, changeQty, removeFromCart, computeTotal } = vm.runInContext(
  "({ PRODUCTS, addToCart, changeQty, removeFromCart, computeTotal })",
  context,
);

test("sample order totals ₱165.00", () => {
  let cart = [];
  const chicken = PRODUCTS.find((product) => product.id === 2);
  const rice = PRODUCTS.find((product) => product.id === 1);
  const tea = PRODUCTS.find((product) => product.id === 5);

  cart = addToCart(cart, chicken);
  cart = addToCart(cart, chicken);
  cart = addToCart(cart, rice);
  cart = addToCart(cart, tea);

  assert.equal(cart.length, 3);
  assert.equal(cart.find((item) => item.id === 2).qty, 2);
  assert.equal(cart.find((item) => item.id === 2).price * 2, 13000);
  assert.equal(computeTotal(cart), 16500);

  cart = changeQty(cart, 2, -1);
  assert.equal(computeTotal(cart), 10000);
  cart = changeQty(cart, 2, 1);
  assert.equal(computeTotal(cart), 16500);
  cart = removeFromCart(cart, 5);
  assert.equal(computeTotal(cart), 14500);
});

test("quantity stays between one and 99; removal restores an empty cart", () => {
  const rice = PRODUCTS.find((product) => product.id === 1);
  let cart = addToCart([], rice);
  cart = changeQty(cart, rice.id, -1);
  assert.equal(cart[0].qty, 1);
  cart = changeQty(cart, rice.id, 200);
  assert.equal(cart[0].qty, 99);
  cart = addToCart(cart, rice);
  assert.equal(cart[0].qty, 99);
  cart = removeFromCart(cart, rice.id);
  assert.equal(computeTotal(cart), 0);
  assert.equal(cart.length, 0);
});

test("menu and cart clicks update the displayed total", () => {
  function element() {
    return {
      children: [],
      dataset: {},
      listeners: {},
      classList: { toggle() {} },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      setAttribute() {},
      addEventListener(type, handler) { this.listeners[type] = handler; },
    };
  }

  const roots = Object.fromEntries([
    "product-list", "cart-items", "order-count", "order-total", "step-browse", "step-order", "cart-message",
  ].map((id) => [`#${id}`, element()]));
  const document = {
    querySelector(selector) { return roots[selector]; },
    createElement: element,
    createDocumentFragment: element,
  };
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"), vm.createContext({ document }));

  function click(section, dataset) {
    roots[section].listeners.click({ target: { closest: () => ({ dataset }) } });
  }

  click("#product-list", { productId: "2" });
  click("#product-list", { productId: "2" });
  click("#product-list", { productId: "1" });
  click("#product-list", { productId: "5" });
  assert.equal(roots["#order-total"].textContent, "₱165.00");
  assert.equal(roots["#order-count"].textContent, "4 items");
  const rows = roots["#cart-items"].children[0].children;
  assert.equal(rows[0].children[2].textContent, "₱130.00");
  assert.equal(rows[1].children[2].textContent, "₱15.00");
  assert.equal(rows[2].children[2].textContent, "₱20.00");
  click("#cart-items", { productId: "2", action: "decrease" });
  assert.equal(roots["#order-total"].textContent, "₱100.00");
  click("#cart-items", { productId: "5", action: "remove" });
  assert.equal(roots["#order-total"].textContent, "₱80.00");
});
