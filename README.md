# Campus Cafeteria POS

A desktop point-of-sale application for the IT 415 practical examination. It uses only HTML, CSS, and JavaScript and runs locally in a browser.

## Development stages

| Stage | Scope | Status |
| --- | --- | --- |
| 1. Project setup and interface design | Create the files, display the six products, and lay out the order, payment, and receipt sections. | Complete |
| 2. Ordering and calculation functions | Add and remove products, change quantities, and calculate line subtotals and the order total. | Complete |
| 3. Payment validation and final improvements | Validate cash, calculate change, confirm payment, generate a receipt, reset, and test the full flow. | Complete |

The application now supports the full cash transaction flow. All transaction data stays in browser memory; refreshing the page starts a fresh order.

## Files

- `index.html`: the four application sections and accessible labels.
- `styles.css`: desktop layout, responsive rules, and visual states.
- `app.js`: hard-coded products, cart and payment functions, validation, receipt creation, and rendering.
- `tests/cart.test.js`: optional automated cart and transaction checks using Node.js only.

## Run and test the application

1. Open `index.html` in a desktop browser. No installation or server is needed.
2. Add **Fried Chicken (1 pc)** twice, **Rice (Plain)** once, and **Iced Tea (cup)** once. Check that the line subtotals are **₱130.00**, **₱15.00**, and **₱20.00**, and the total is **₱165.00**.
3. Click **Complete payment** with the cash field blank to see **Please enter the cash received.** Then type `d`, `-50`, and `100`; the message should update as you type to **Please enter a valid number with up to two decimal places.**, **Cash received cannot be negative.**, and **Insufficient payment. Please enter at least ₱165.00.**, respectively. Complete payment stays disabled while the entry is invalid. Type `200` to clear the error and enable it.
4. Enter `200` and select **Complete payment**. Check for **Payment successful**, **₱35.00** change, and a receipt with all items, quantities, subtotals, total, cash received, change, and transaction reference.
5. Check that cart and payment controls are locked. Select **New Transaction** and check that the cart, payment amount, message, and receipt clear and that the menu can be used again.
6. Also test decreasing Fried Chicken to one (**₱100.00** total), increasing it again (**₱165.00**), removing Iced Tea (**₱145.00**), and removing all lines (**₱0.00**). Narrow the window to check the single-column layout.

If Node.js is installed, run `node --test tests/cart.test.js` for automated checks. The POS itself does not require Node.js.
