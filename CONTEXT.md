# Midnight Coffee

A single-context demo coffee shop: a public storefront where customers browse products and place orders, and an admin area where staff manage the catalogue and order lifecycle.

## Language

### Catalogue

**Product**:
A single item for sale, either a drink or a piece of food.
_Avoid_: Item, SKU, listing

### Ordering

**Cart**:
The customer's in-progress selection, held only in their own browser until checkout.
_Avoid_: Basket, bag

**Order**:
A placed, priced and paid-for set of items belonging to one customer.
_Avoid_: Purchase, transaction, sale

**Order Item**:
One product line within an Order, carrying the price the product had at the moment the order was placed.
_Avoid_: Line item, cart item (a Cart Item is the client-side `{productId, quantity}` pair, which is a different, thinner thing)

**Customer**:
The name, email, phone and address captured with a single Order. Customers are not accounts — there is no identity that persists across orders.
_Avoid_: User (a User is the admin operator), account, client

**Subtotal**:
The sum of an Order's item subtotals, before any Discount.

**Total**:
The amount the customer actually pays: Subtotal minus Discount.
_Avoid_: Grand total, amount due

### Discounting

**Coupon**:
A named rule that grants a fixed reduction on an Order, subject to its own eligibility conditions.
_Avoid_: Promotion, promo, voucher, offer, deal

**Coupon Code**:
The string a customer types at checkout to claim a Coupon. Distinct from the Coupon itself: the code identifies, the Coupon decides.
_Avoid_: Promo code, discount code

**Discount**:
The amount, in cents, that a Coupon takes off one specific Order. A Coupon is the rule; a Discount is the result of applying it.
_Avoid_: Reduction, saving, rebate
