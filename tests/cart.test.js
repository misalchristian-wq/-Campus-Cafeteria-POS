"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

// Load the browser script without a DOM so its pure cart functions can be checked.
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"), context);
const { PRODUCTS, addToCart, changeQty, removeFromCart, computeTotal, validatePayment, computeChange, buildReceipt } = vm.runInContext(
  "({ PRODUCTS, addToCart, changeQty, removeFromCart, computeTotal, validatePayment, computeChange, buildReceipt })",
  context,
);

function createApp() {
  function element() {
    return {
      children: [],
      dataset: {},
      listeners: {},
      classList: { toggle() {} },
      value: "",
      disabled: false,
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      setAttribute() {},
      addEventListener(type, handler) { this.listeners[type] = handler; },
      focus() { this.listeners.focus?.(); },
    };
  }

  const roots = Object.fromEntries([
    "product-list", "cart-items", "order-count", "order-total", "step-browse", "step-order",
    "step-payment", "step-receipt", "cart-message", "payment-form", "cash-amount",
    "payment-message", "pay-button", "new-transaction", "receipt-content",
  ].map((id) => [`#${id}`, element()]));
  const document = {
    querySelector(selector) { return roots[selector]; },
    createElement: element,
    createDocumentFragment: element,
  };
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"), vm.createContext({ document }));

  function click(section, dataset = {}) {
    roots[section].listeners.click({ target: { closest: () => ({ dataset }) } });
  }
  function submit(value) {
    roots["#cash-amount"].value = value;
    roots["#payment-form"].listeners.submit({ preventDefault() {} });
  }
  function visibleText(node) {
    return [node.textContent || "", ...node.children.map(visibleText)].join(" ");
  }
  return { roots, click, submit, visibleText };
}

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
  const { roots, click } = createApp();

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

test("cash validation and the sample change are exact", () => {
  for (const raw of ["", "  ", "abc", "-50", "12a", "1.234"]) {
    assert.equal(validatePayment(raw, 16500).message, "Please enter a valid payment amount.");
  }
  assert.equal(validatePayment("100", 16500).message, "Insufficient payment. Please enter at least ₱165.00.");
  assert.equal(validatePayment("165", 16500).paid, 16500);
  assert.equal(validatePayment("200", 16500).paid, 20000);
  assert.equal(computeChange(20000, 16500), 3500);
});

test("receipt is a snapshot of items and amounts", () => {
  const cart = [
    { id: 2, name: "Fried Chicken (1 pc)", price: 6500, qty: 2 },
    { id: 1, name: "Rice (Plain)", price: 1500, qty: 1 },
    { id: 5, name: "Iced Tea (cup)", price: 2000, qty: 1 },
  ];
  const receipt = buildReceipt(cart, 20000, "CC-TEST-001");
  assert.equal(receipt.reference, "CC-TEST-001");
  assert.equal(receipt.total, 16500);
  assert.equal(receipt.cashReceived, 20000);
  assert.equal(receipt.change, 3500);
  assert.equal(receipt.items[0].subtotal, 13000);
  cart[0].qty = 1;
  assert.equal(receipt.items[0].qty, 2);
});

test("payment locks the sale and New Transaction clears it", () => {
  const { roots, click, submit, visibleText } = createApp();
  click("#product-list", { productId: "2" });
  click("#product-list", { productId: "2" });
  click("#product-list", { productId: "1" });
  click("#product-list", { productId: "5" });
  submit("");
  assert.match(roots["#payment-message"].textContent, /valid payment amount/);
  submit("100");
  assert.match(roots["#payment-message"].textContent, /Insufficient payment/);
  submit("200");
  assert.equal(roots["#payment-message"].textContent, "Payment successful. Change: ₱35.00.");
  assert.equal(roots["#cash-amount"].disabled, true);
  assert.equal(roots["#pay-button"].disabled, true);
  assert.equal(roots["#new-transaction"].disabled, false);
  const receipt = visibleText(roots["#receipt-content"]);
  for (const text of ["Transaction reference:", "Fried Chicken (1 pc)", "Rice (Plain)", "Iced Tea (cup)", "₱165.00", "₱200.00", "₱35.00"]) {
    assert.ok(receipt.includes(text), `Receipt missing ${text}`);
  }
  click("#product-list", { productId: "1" });
  assert.equal(roots["#order-total"].textContent, "₱165.00");
  click("#new-transaction");
  assert.equal(roots["#order-total"].textContent, "₱0.00");
  assert.equal(roots["#cash-amount"].value, "");
  assert.equal(roots["#cash-amount"].disabled, false);
  assert.equal(roots["#payment-message"].textContent, "");
  assert.match(visibleText(roots["#receipt-content"]), /No completed transaction yet/);
  click("#product-list", { productId: "1" });
  assert.equal(roots["#order-total"].textContent, "₱15.00");
});

test("empty orders cannot be paid and repeated submit keeps one receipt", () => {
  const { roots, click, submit, visibleText } = createApp();
  submit("200");
  assert.match(roots["#payment-message"].textContent, /cart is empty/);
  click("#product-list", { productId: "1" });
  submit("15");
  const firstReceipt = visibleText(roots["#receipt-content"]);
  assert.match(firstReceipt, /₱0.00/);
  submit("20");
  assert.equal(visibleText(roots["#receipt-content"]), firstReceipt);
  click("#new-transaction");
  click("#product-list", { productId: "1" });
  submit("20");
  const secondReceipt = visibleText(roots["#receipt-content"]);
  assert.notEqual(secondReceipt, firstReceipt);
  assert.match(secondReceipt, /₱5.00/);
});
