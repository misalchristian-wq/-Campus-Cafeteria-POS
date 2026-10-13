# Campus Cafeteria POS

A desktop point-of-sale application for the IT 415 practical examination. It uses only HTML, CSS, and JavaScript and runs locally in a browser.

## Development stages

| Stage | Scope | Status |
| --- | --- | --- |
| 1. Project setup and interface design | Create the files, display the six products, and lay out the order, payment, and receipt sections. | Complete |
| 2. Ordering and calculation functions | Add and remove products, change quantities, and calculate line subtotals and the order total. | Complete |
| 3. Payment validation and final improvements | Validate cash, calculate change, confirm payment, generate a receipt, reset, and test the full flow. | Complete |

The application now supports the full cash transaction flow with a welcome screen, a 2.5-second cooking loader, menu images, light and dark themes, and dialogs for errors, payment confirmation, and receipts. The loader uses the animated [Foodie Maryam - Loading 1](https://dribbble.com/shots/14475354-Foodie-Maryam-Loading-1) shot by Amir Parva for Parva Studio. All transaction data stays in browser memory; refreshing the page starts a fresh order.

## Files

- `index.html`: the welcome and loading screens, POS workspace, dialogs, and accessible labels.
- `styles.css`: desktop layout, themes, images, animations, dialogs, and print layout.
- `app.js`: the original product, cart, payment, validation, and receipt functions; unchanged by the redesign.
- `experience.js`: interface-only behavior for theme, screens, dialogs, confirmation, and printing.
- `assets/foodie-maryam-loading.gif`: the Dribbble cooking animation used during loading, saved locally so the POS runs offline.
- `assets/cooking-reference.png`: the earlier supplied cooking illustration, kept as a reference.
- `assets/menu-contact-sheet.png`: generated food images for the six menu cards.
- `tests/cart.test.js`: optional automated cart and transaction checks using Node.js only.
- `tests/experience.test.js`: optional checks for the welcome, loading, modal, and print flows.

## Run and test the application

1. Open `index.html` in a desktop browser. No installation or server is needed. Select **Click to Begin** and check that the cooking image appears for about 2.5 seconds before the POS opens. Use the theme button to switch between light and dark modes.
2. Add **Fried Chicken (1 pc)** twice, **Rice (Plain)** once, and **Iced Tea (cup)** once. Check that the line subtotals are **₱130.00**, **₱15.00**, and **₱20.00**, and the total is **₱165.00**.
3. Select **Complete payment** with the cash field blank to see the error dialog. Then type `d`, `-50`, and `100`; after a short pause each should show the relevant error dialog. Complete payment stays disabled while the entry is invalid. Type `200` to clear the error and enable it.
4. Select **Complete payment**, review the **₱165.00** total, **₱200.00** cash, and **₱35.00** change in the confirmation dialog, then confirm. Check that the receipt modal shows all items, quantities, subtotals, total, cash received, change, and a transaction reference.
5. Select **Print receipt** to watch the paper animation and open the browser print dialog. Cancel or finish printing, then select **New Transaction**. Check that the cart, payment amount, message, and receipt clear and that the menu can be used again.
6. Also test decreasing Fried Chicken to one (**₱100.00** total), increasing it again (**₱165.00**), removing Iced Tea (**₱145.00**), and removing all lines (**₱0.00**). Narrow the window to check the single-column layout.

If Node.js is installed, run `node --test tests/cart.test.js tests/experience.test.js` for automated checks. The POS itself does not require Node.js.
