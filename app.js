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

// One formatter can be reused by the cart and receipt stages.
function formatMoney(centavos) {
  return `₱${(centavos / 100).toFixed(2)}`;
}

// Stage 1 renders the fixed menu. Stage 2 connects the buttons to the cart.
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
    button.disabled = true;
    bottom.append(price, button);
    card.append(top, name, bottom);
    fragment.append(card);
  }
  list.replaceChildren(fragment);
}

renderProducts();
