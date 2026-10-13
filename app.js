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
let cart = [];

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
        createButton("−", "quantity-button", "decrease", item, `Decrease ${item.name} quantity`, item.qty === 1),
      );
      const quantity = document.createElement("span");
      quantity.className = "quantity-value";
      quantity.textContent = String(item.qty);
      quantity.setAttribute("aria-label", `Quantity ${item.qty}`);
      controls.append(quantity, createButton("+", "quantity-button", "increase", item, `Increase ${item.name} quantity`, item.qty === MAX_QUANTITY));

      const subtotal = document.createElement("strong");
      subtotal.className = "line-subtotal";
      subtotal.textContent = formatMoney(item.price * item.qty);
      const remove = createButton("Remove", "remove-button", "remove", item, `Remove ${item.name}`);
      row.append(details, controls, subtotal, remove);
      fragment.append(row);
    }
  }

  list.replaceChildren(fragment);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelector("#order-count").textContent = `${count} ${count === 1 ? "item" : "items"}`;
  document.querySelector("#order-total").textContent = formatMoney(computeTotal(cart));
  document.querySelector("#step-browse").classList.toggle("is-current", cart.length === 0);
  document.querySelector("#step-order").classList.toggle("is-current", cart.length > 0);
}

function showCartMessage(message) {
  document.querySelector("#cart-message").textContent = message;
}

function startOrdering() {
  renderProducts();
  renderCart();

  document.querySelector("#product-list").addEventListener("click", (event) => {
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
    renderCart();
    showCartMessage(`${product.name} added to cart.`);
  });

  document.querySelector("#cart-items").addEventListener("click", (event) => {
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
    renderCart();
  });
}

if (typeof document !== "undefined") startOrdering();
