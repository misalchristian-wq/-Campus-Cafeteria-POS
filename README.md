# Campus Cafeteria POS

A desktop point-of-sale application for the IT 415 practical examination. It uses only HTML, CSS, and JavaScript and runs locally in a browser.

## Development stages

| Stage | Scope | Status |
| --- | --- | --- |
| 1. Project setup and interface design | Create the files, display the six products, and lay out the order, payment, and receipt sections. | Complete |
| 2. Ordering and calculation functions | Add and remove products, change quantities, and calculate line subtotals and the order total. | Complete |
| 3. Payment validation and final improvements | Validate cash, calculate change, confirm payment, generate a receipt, reset, and test the full flow. | Next |

Stage 2 supports ordering and live totals. Complete payment and New Transaction remain disabled until Stage 3.

## Files

- `index.html`: the four application sections and accessible labels.
- `styles.css`: desktop layout, responsive rules, and visual states.
- `app.js`: hard-coded product catalog, cart functions, live calculations, and rendering.
- `tests/cart.test.js`: optional automated calculation checks using Node.js only.

## Run and test Stage 2

1. Open `index.html` in a desktop browser. No installation or server is needed.
2. Add **Fried Chicken (1 pc)** twice, **Rice (Plain)** once, and **Iced Tea (cup)** once. Check that the line subtotals are **₱130.00**, **₱15.00**, and **₱20.00**, and the total is **₱165.00**.
3. Decrease Fried Chicken to one and check that the total becomes **₱100.00**. Increase it again and check that the total returns to **₱165.00**.
4. Remove Iced Tea and check that the total becomes **₱145.00**. Remove the remaining lines and check that the empty cart and **₱0.00** total return.
5. Narrow the window to check the single-column layout.

If Node.js is installed, run `node --test tests/cart.test.js` for the calculation checks. The POS itself does not require Node.js.

## Full application test after Stage 3

Add two **Fried Chicken (1 pc)**, one **Rice (Plain)**, and one **Iced Tea (cup)**. The total should be **₱165.00**. Enter **₱200.00** in cash; change should be **₱35.00**. Also test blank, non-numeric, negative, and insufficient payments, then use **New Transaction** to verify that the cart, payment, and receipt are cleared.
