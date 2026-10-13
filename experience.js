"use strict";

// Presentation-only behavior lives here. Cart, payment, and receipt functions stay in app.js.
const welcomeScreen = document.querySelector("#welcome-screen");
const loadingScreen = document.querySelector("#loading-screen");
const appShell = document.querySelector("#app-shell");
const confirmDialog = document.querySelector("#confirm-dialog");
const receiptDialog = document.querySelector("#receipt-dialog");
const cashInput = document.querySelector("#cash-amount");
const payButton = document.querySelector("#pay-button");
const paymentForm = document.querySelector("#payment-form");

// Theme preference is separate from transaction data.
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector("#theme-label").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  document.querySelector("#theme-toggle").setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  try { localStorage.setItem("campus-cafeteria-theme", theme); } catch { /* Storage may be unavailable for local files. */ }
}

let savedTheme;
try { savedTheme = localStorage.getItem("campus-cafeteria-theme"); } catch { savedTheme = null; }
setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light");
document.querySelector("#theme-toggle").addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

// The supplied cooking illustration is shown for 2.5 seconds after Begin.
document.querySelector("#begin-button").addEventListener("click", (event) => {
  event.currentTarget.disabled = true;
  welcomeScreen.classList.add("is-leaving");
  window.setTimeout(() => {
    welcomeScreen.hidden = true;
    loadingScreen.hidden = false;
    document.body.classList.remove("is-landing");
    document.body.classList.add("is-loading");
    window.setTimeout(() => {
      loadingScreen.classList.add("is-leaving");
      document.body.classList.remove("is-loading");
      appShell.classList.add("is-opening");
      window.setTimeout(() => {
        loadingScreen.hidden = true;
        appShell.classList.remove("is-opening");
        document.querySelector("#product-list .button")?.focus();
      }, 430);
    }, 2500);
  }, 430);
});

// A capturing submit listener asks for confirmation before the existing handler runs.
let allowCoreSubmit = false;
paymentForm.addEventListener("submit", (event) => {
  if (allowCoreSubmit) {
    allowCoreSubmit = false;
    return;
  }
  if (cart.length === 0) return;
  const total = computeTotal(cart);
  const validation = validatePayment(cashInput.value, total);
  if (!validation.ok) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  document.querySelector("#confirm-total").textContent = formatMoney(total);
  document.querySelector("#confirm-cash").textContent = formatMoney(validation.paid);
  document.querySelector("#confirm-change").textContent = formatMoney(computeChange(validation.paid, total));
  confirmDialog.showModal();
}, true);

document.querySelector("#confirm-cancel").addEventListener("click", () => confirmDialog.close());
document.querySelector("#confirm-accept").addEventListener("click", () => {
  confirmDialog.close();
  allowCoreSubmit = true;
  try { paymentForm.requestSubmit(payButton); } finally { allowCoreSubmit = false; }
});

// app.js fills the receipt as a snapshot. Open it in a modal when it is ready.
const receiptContent = document.querySelector("#receipt-content");
new MutationObserver(() => {
  if (receiptContent.classList.contains("receipt-paper") && !receiptDialog.open) receiptDialog.showModal();
}).observe(receiptContent, { attributes: true, attributeFilter: ["class"] });

receiptDialog.addEventListener("cancel", (event) => event.preventDefault());
document.querySelector("#new-transaction").addEventListener("click", () => {
  receiptDialog.close();
  document.querySelector("#print-animation").hidden = true;
});

// Show paper feeding through the printer before opening the browser print dialog.
const printButton = document.querySelector("#print-receipt");
printButton.addEventListener("click", () => {
  if (printButton.disabled) return;
  printButton.disabled = true;
  document.querySelector("#print-animation").hidden = false;
  window.setTimeout(() => {
    document.querySelector("#print-animation").hidden = true;
    printButton.disabled = false;
    window.print();
  }, 1450);
});
