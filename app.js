"use strict";

// Product prices use centavos so later cart and change calculations stay exact.
const PRODUCTS = Object.freeze([
  Object.freeze({ id: 1, name: "Rice (Plain)", price: 1500, category: "Meal", symbol: "R" }),
  Object.freeze({ id: 2, name: "Fried Chicken (1 pc)", price: 6500, category: "Meal", symbol: "FC" }),
  Object.freeze({ id: 3, name: "Pork Adobo", price: 6000, category: "Meal", symbol: "PA" }),
  Object.freeze({ id: 4, name: "Vegetable Side Dish", price: 3500, category: "Side", symbol: "VS" }),
  Object.freeze({ id: 5, name: "Iced Tea (cup)", price: 2000, category: "Drink", symbol: "IT" }),
  Object.freeze({ id: 6, name: "Bottled Water", price: 2000, category: "Drink", symbol: "BW" }),
]);
const MAX_QUANTITY = 99;
const MAX_PAYMENT_CENTAVOS = 10000000;
let cart = [];
let completedSale = null;
let paymentStarted = false;
let transactionCounter = 0;

// One formatter can be reused by the cart and receipt stages.
function formatMoney(centavos) {
  return `₱${(centavos / 100).toFixed(2)}`;
}

// Render the fixed menu from the catalog; only product IDs are read from buttons.
function renderProducts() {
  const list = document.querySelector("#product-list");
  const fragment = document.createDocumentFragment();

  for (const product of PRODUCTS) {
    const card = document.createElement("article");
    card.className = "product-card";
    const top = document.createElement("div");
    top.className = "product-card-top";
    const symbol = document.createElement("span");
    symbol.className = "product-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = product.symbol;
    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.category;
    top.append(symbol, category);
    const name = document.createElement("h3");
    name.textContent = product.name;
    const bottom = document.createElement("div");
    bottom.className = "product-card-bottom";
    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = formatMoney(product.price);
    const button = document.createElement("button");
    button.className = "button button-primary";
    button.type = "button";
    button.dataset.productId = String(product.id);
    button.textContent = "Add";
    button.setAttribute("aria-label", `Add ${product.name} to cart`);
    button.disabled = Boolean(completedSale);
    bottom.append(price, button);
    card.append(top, name, bottom);
    fragment.append(card);
  }
  list.replaceChildren(fragment);
}

// These functions return new cart arrays, making each cart change easy to check.
function addToCart(currentCart, product) {
  if (!product) return currentCart;
  const existing = currentCart.find((item) => item.id === product.id);
  if (existing) {
    if (existing.qty >= MAX_QUANTITY) return currentCart;
    return currentCart.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
  }
  return [...currentCart, { id: product.id, name: product.name, price: product.price, qty: 1 }];
}

function changeQty(currentCart, id, delta) {
  if (!Number.isInteger(delta) || !currentCart.some((item) => item.id === id)) return currentCart;
  return currentCart.map((item) => {
    if (item.id !== id) return item;
    return { ...item, qty: Math.max(1, Math.min(MAX_QUANTITY, item.qty + delta)) };
  });
}

function removeFromCart(currentCart, id) {
  return currentCart.filter((item) => item.id !== id);
}

function computeTotal(currentCart) {
  return currentCart.reduce((total, item) => total + item.price * item.qty, 0);
}

function createButton(text, className, action, item, label, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.action = action;
  button.dataset.productId = String(item.id);
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.disabled = disabled;
  return button;
}

function renderCart() {
  const list = document.querySelector("#cart-items");
  const fragment = document.createDocumentFragment();

  if (cart.length === 0) {
    list.className = "empty-state";
    const icon = document.createElement("span");
    icon.className = "empty-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "＋";
    const title = document.createElement("strong");
    title.textContent = "Your cart is empty";
    const detail = document.createElement("p");
    detail.textContent = "Items you add will appear here with their quantities and subtotals.";
    fragment.append(icon, title, detail);
  } else {
    list.className = "cart-items";
    for (const item of cart) {
      const row = document.createElement("div");
      row.className = "cart-row";
      const details = document.createElement("div");
      details.className = "cart-details";
      const name = document.createElement("strong");
      name.textContent = item.name;
      const unitPrice = document.createElement("span");
      unitPrice.className = "unit-price";
      unitPrice.textContent = `${formatMoney(item.price)} each`;
      details.append(name, unitPrice);

      const controls = document.createElement("div");
      controls.className = "quantity-controls";
      controls.append(
        createButton("−", "quantity-button", "decrease", item, `Decrease ${item.name} quantity`, Boolean(completedSale) || item.qty === 1),
      );
      const quantity = document.createElement("span");
      quantity.className = "quantity-value";
      quantity.textContent = String(item.qty);
      quantity.setAttribute("aria-label", `Quantity ${item.qty}`);
      controls.append(quantity, createButton("+", "quantity-button", "increase", item, `Increase ${item.name} quantity`, Boolean(completedSale) || item.qty === MAX_QUANTITY));

      const subtotal = document.createElement("strong");
      subtotal.className = "line-subtotal";
      subtotal.textContent = formatMoney(item.price * item.qty);
      const remove = createButton("Remove", "remove-button", "remove", item, `Remove ${item.name}`, Boolean(completedSale));
      row.append(details, controls, subtotal, remove);
      fragment.append(row);
    }
  }

  list.replaceChildren(fragment);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelector("#order-count").textContent = `${count} ${count === 1 ? "item" : "items"}`;
  document.querySelector("#order-total").textContent = formatMoney(computeTotal(cart));
  renderWorkflow();
}

function renderWorkflow() {
  const current = completedSale ? "receipt" : paymentStarted ? "payment" : cart.length ? "order" : "browse";
  for (const step of ["browse", "order", "payment", "receipt"]) {
    document.querySelector(`#step-${step}`).classList.toggle("is-current", step === current);
  }
}

function showCartMessage(message) {
  document.querySelector("#cart-message").textContent = message;
}

// Accept only whole pesos or up to two decimal places; never use parseFloat.
function validatePayment(raw, total) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    return { ok: false, message: "Please enter a valid payment amount." };
  }
  const [pesos, centavos = ""] = value.split(".");
  const paid = Number(pesos) * 100 + Number(centavos.padEnd(2, "0"));
  if (!Number.isSafeInteger(paid) || paid > MAX_PAYMENT_CENTAVOS) {
    return { ok: false, message: "Please enter a valid payment amount." };
  }
  if (paid < total) {
    return { ok: false, message: `Insufficient payment. Please enter at least ${formatMoney(total)}.` };
  }
  return { ok: true, paid };
}

function computeChange(paid, total) {
  return paid - total;
}

// Copy every line so the receipt cannot change after payment.
function buildReceipt(currentCart, paid, reference) {
  const items = currentCart.map((item) => ({
    name: item.name,
    qty: item.qty,
    subtotal: item.price * item.qty,
  }));
  const total = computeTotal(currentCart);
  return { reference, items, total, cashReceived: paid, change: computeChange(paid, total) };
}

function showPaymentMessage(message, kind = "") {
  const display = document.querySelector("#payment-message");
  display.textContent = message;
  display.className = `payment-message${kind ? ` is-${kind}` : ""}`;
  display.setAttribute("role", kind === "error" ? "alert" : "status");
}

function renderReceipt(receipt) {
  const display = document.querySelector("#receipt-content");
  if (!receipt) {
    display.className = "receipt-empty";
    const icon = document.createElement("span");
    icon.className = "receipt-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "▤";
    const message = document.createElement("span");
    message.textContent = "No completed transaction yet.";
    display.replaceChildren(icon, message);
    return;
  }

  display.className = "receipt-paper";
  const heading = document.createElement("div");
  heading.className = "receipt-meta";
  const store = document.createElement("strong");
  store.textContent = "Campus Cafeteria POS";
  const reference = document.createElement("span");
  reference.textContent = `Transaction reference: ${receipt.reference}`;
  heading.append(store, reference);

  const table = document.createElement("table");
  table.className = "receipt-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const title of ["Item", "Qty", "Subtotal"]) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = title;
    headerRow.append(cell);
  }
  thead.append(headerRow);
  const tbody = document.createElement("tbody");
  for (const item of receipt.items) {
    const row = document.createElement("tr");
    for (const value of [item.name, String(item.qty), formatMoney(item.subtotal)]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    tbody.append(row);
  }
  table.append(thead, tbody);

  const totals = document.createElement("div");
  totals.className = "receipt-totals";
  for (const [label, amount] of [
    ["Total", receipt.total],
    ["Cash received", receipt.cashReceived],
    ["Change", receipt.change],
  ]) {
    const row = document.createElement("div");
    const caption = document.createElement("span");
    caption.textContent = label;
    const value = document.createElement("strong");
    value.textContent = formatMoney(amount);
    row.append(caption, value);
    totals.append(row);
  }
  display.replaceChildren(heading, table, totals);
}

function completePayment(event) {
  event.preventDefault();
  if (completedSale) return;
  if (cart.length === 0) {
    showPaymentMessage("Your cart is empty. Please add at least one product before paying.", "error");
    return;
  }

  const cashInput = document.querySelector("#cash-amount");
  const result = validatePayment(cashInput.value, computeTotal(cart));
  if (!result.ok) {
    showPaymentMessage(result.message, "error");
    paymentStarted = true;
    renderWorkflow();
    return;
  }

  // Change and the receipt are ready before the cart is locked.
  const reference = `CC-${Date.now()}-${String(++transactionCounter).padStart(3, "0")}`;
  completedSale = buildReceipt(cart, result.paid, reference);
  paymentStarted = false;
  renderProducts();
  renderCart();
  renderReceipt(completedSale);
  cashInput.disabled = true;
  document.querySelector("#pay-button").disabled = true;
  document.querySelector("#new-transaction").disabled = false;
  showCartMessage("");
  showPaymentMessage(`Payment successful. Change: ${formatMoney(completedSale.change)}.`, "success");
}

function newTransaction() {
  cart = [];
  completedSale = null;
  paymentStarted = false;
  const cashInput = document.querySelector("#cash-amount");
  cashInput.value = "";
  cashInput.disabled = false;
  document.querySelector("#pay-button").disabled = false;
  document.querySelector("#new-transaction").disabled = true;
  showCartMessage("");
  showPaymentMessage("");
  renderProducts();
  renderCart();
  renderReceipt(null);
  cashInput.focus();
}

function startOrdering() {
  renderProducts();
  renderCart();
  document.querySelector("#payment-form").addEventListener("submit", completePayment);
  document.querySelector("#new-transaction").addEventListener("click", newTransaction);
  const cashInput = document.querySelector("#cash-amount");
  cashInput.addEventListener("focus", () => {
    if (cart.length > 0 && !completedSale) {
      paymentStarted = true;
      renderWorkflow();
    }
  });
  cashInput.addEventListener("input", () => {
    showPaymentMessage("");
    if (cart.length > 0 && !completedSale) {
      paymentStarted = true;
      renderWorkflow();
    }
  });

  document.querySelector("#product-list").addEventListener("click", (event) => {
    if (completedSale) return;
    const button = event.target.closest("button[data-product-id]");
    if (!button) return;
    const product = PRODUCTS.find((entry) => entry.id === Number(button.dataset.productId));
    if (!product) return;
    const nextCart = addToCart(cart, product);
    if (nextCart === cart) {
      showCartMessage(`Maximum quantity for ${product.name} is ${MAX_QUANTITY}.`);
      return;
    }
    cart = nextCart;
    paymentStarted = false;
    renderCart();
    showPaymentMessage("");
    showCartMessage(`${product.name} added to cart.`);
  });

  document.querySelector("#cart-items").addEventListener("click", (event) => {
    if (completedSale) return;
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.productId);
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    if (button.dataset.action === "remove") {
      cart = removeFromCart(cart, id);
      showCartMessage(`${item.name} removed from cart.`);
    } else if (button.dataset.action === "increase") {
      cart = changeQty(cart, id, 1);
      showCartMessage(`${item.name} quantity updated.`);
    } else if (button.dataset.action === "decrease") {
      cart = changeQty(cart, id, -1);
      showCartMessage(`${item.name} quantity updated.`);
    }
    paymentStarted = false;
    renderCart();
    showPaymentMessage("");
  });
}

if (typeof document !== "undefined") startOrdering();
