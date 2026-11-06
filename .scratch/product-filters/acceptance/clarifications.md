# Clarifications: product-filters

Date: 2026-11-06 · Status: **all questions accepted with proposed defaults (2026-11-06)**

The spec and tickets are read-only. Answer each question with **accept** (take the proposed default), **change** (give another answer) or **defer**.

## Trace index

- Stories: `US-1` … `US-28` (spec "User Stories", by number)
- Tickets: `T01` category end to end · `T02` search · `T03` only available · `T04` price range · `T05` final verification
- Dependencies: T02, T03, T04 ← T01; T05 ← T02, T03, T04
- Criteria: `T<NN>-AC<k>` is the k-th checkbox of ticket NN (T01: 10, T02: 8, T03: 7, T04: 10, T05: 9)
- Testing decisions: `TD-1` good test = external behaviour only · `TD-2` only the pure filter function is tested (single seam); page and form are checked manually · `TD-3` tests use inline product arrays · `TD-4` case list · `TD-5` prior art · `TD-6` manual check + `npm test`/`npm run lint`

## Observation (no answer needed)

Spec and all five tickets are marked **resolved**, although every criterion checkbox is still unticked. The scenarios therefore double as retrospective acceptance and regression checks of delivered work. Any scenario that fails against the running app is a defect, not a gap.

## Questions

### Cross-cutting

**Q1 · Untestable at the seam** · affects `TD-2`, `T01-AC2/3/5/6/7/8`, `T02-AC1/6`, `T03-AC1/4`, `T04-AC1/7`, `T05-AC1…AC7`, `US-13…US-19`, `US-25`, `US-26`, `US-28`
The spec automates only the pure filter function. Form, URL, count line, empty state, back button, Enter-to-submit, labels and narrow-screen wrapping are manual checks.
*Proposed default:* write every scenario in shopper terms, and tag it `@logic` (observable at the filter function) or `@manual` (checked in the browser). Do not invent new automated seams.

**Q2 · Orphan criteria, process only** · affects `T01-AC1`, `T01-AC10`, `T02-AC7/8`, `T03-AC6/7`, `T04-AC9(tests)/10`, `T05-AC8/9`
These criteria trace to no user story: discarding the old attempt, writing unit tests, `npm test`, `npm run lint`, `npm run build`, manual dev-server checks, and "defects fixed or noted as new tickets".
*Proposed default:* no Gherkin. The matrix lists them as `non-behavioural (tooling)` and links them to `TD-6`.

### T01 category end to end

**Q3 · Vague · empty menu** · affects `US-16`, `US-17`, `US-18`, `T01-AC6/7`
"No products match your filters" is defined for zero matches. It is not defined when the menu itself has zero products and no filter is active, where "Clear filters" would lead nowhere.
*Proposed default:* the same empty state and message appear; the link still goes to the bare home URL.

**Q4 · Vague · count wording** · affects `US-16`, `T01-AC6`
Is the wording always "products", or "Showing 1 of 8 product" for X = 1? Is the line shown when X = Y with no filters active?
*Proposed default:* always "Showing X of Y products", shown always, including X = 0, 1 and X = Y.

**Q5 · Missing boundary · what the form shows for rejected input** · affects `US-15`, `US-21`, `US-22`, `T01-AC5`, `T02-AC6`, `T04-AC7`
Spec says the form is pre-filled from the *parsed* values. For a rejected value (`min=abc`, repeated `q`, `category=tea`) should the field be empty/All, or echo what the user typed? For a valid price typed as `12,50`, is it shown as `12,50`, `12.50` or `12.5`?
*Proposed default:* rejected input leaves the field empty (category shows All). Valid prices are shown in the user's original trimmed text (`12,50` stays `12,50`).

### T02 search

**Q6 · Conflict · which Turkish matching rule applies** · affects `US-5`, `US-6`, `T02-AC3`
Ticket 02 says "lower-casing with the Turkish locale". The spec (Implementation Decisions, parsing rules) says a product matches if the text matches after tr-locale lowercasing **or** default-locale lowercasing, because Turkish-only lowercasing turns "I" into "ı", so "MILK" would miss "milk".
*Proposed default:* the spec rule (either lowercasing matches) is the contract. Scenarios cover `MILK`→`milk`, `LATTE`→`latte`, `ILIK`→`ılık`, `İSTANBUL`→`istanbul`. Propose updating T02's "What to build" and `T02-AC3` to match the spec.

**Q7 · Missing boundary · products without a description** · affects `US-4`, `T02-AC2`
The spec does not say what happens if a product has an empty or absent description when searching.
*Proposed default:* it is treated as empty text, so only the name can match, and nothing errors.

**Q8 · Vague · what counts as matching text** · affects `US-3`, `T02-AC2`
Substring match on the trimmed text. Not stated: internal spaces ("iced  latte" with two spaces), regex characters (`.`, `*`, `(`), and a very long query.
*Proposed default:* the text is matched literally (no regex, no collapsing of internal spaces); special characters never error; no length limit.

### T03 only available

No open questions. `US-24` and `T03-AC3` are covered by the proposed Q1 tagging.

### T04 price range

**Q9 · Missing boundary · accepted number shapes** · affects `US-9`, `US-21`, `T04-AC2/3`
The spec regex `^\d+([.,]\d{1,2})?$` rejects: `.5`, `12.`, `1.234` (three decimals), `1.250,50` (thousand separators), `12 50`, `+5`, `１２` (non-ASCII digits). It accepts `0`, `0,00` and leading zeros (`007`). Rejected means "ignored as if absent", not rounded.
*Proposed default:* exactly as the regex says; confirm that ignoring `1.234` (not rounding it) is intended.

**Q10 · Missing boundary · very large values** · affects `T04-AC2/4`
`99999999999999999999` matches the regex. The cents conversion could exceed safe integer range.
*Proposed default:* any value above the safe-integer range is treated as valid but matches no product for `min` and every product for `max` (no error). Or, if the BA prefers, treated as rejected.

### T05 final verification

**Q11 · Vague · "exactly as before"** · affects `T05-AC7`
Spec: the admin product table and the products API are untouched. It does not say what "exactly as before" means observably when filter parameters are present.
*Proposed default:* two scenarios: the admin product list shows all products even with `?category=drink&min=5` in its URL; the products API returns the full list regardless of those parameters.

**Q12 · Vague · malformed URL scope** · affects `US-23`, `T05-AC6`
"Never show an error page" for malformed URLs. Spec lists unknown category, repeated parameters and junk prices. Not stated: unknown extra parameters (`?foo=1`), empty parameters (`?q=&min=`), and repeated `available`.
*Proposed default:* all of these behave as absent and show the normal page.

## BA answers

Fill in below, or reply in the chat.

| Q | State | Answer |
| --- | --- | --- |
| Q1 | answered | accept (proposed default) |
| Q2 | answered | accept (proposed default) |
| Q3 | answered | accept (proposed default) |
| Q4 | answered | accept (proposed default) |
| Q5 | answered | accept (proposed default) |
| Q6 | answered | accept (proposed default) |
| Q7 | answered | accept (proposed default) |
| Q8 | answered | accept (proposed default) |
| Q9 | answered | accept (proposed default) |
| Q10 | answered | accept (proposed default) |
| Q11 | answered | accept (proposed default) |
| Q12 | answered | accept (proposed default) |

## Proposed edits to the spec and tickets (for the owner of `/to-spec`)

- `T02` "What to build" and `T02-AC3`: align the Turkish-locale wording with the spec's OR rule (pending Q6).
- `T01`…`T05`: tick the criterion checkboxes of resolved tickets, or state in the ticket that the status line is authoritative (pending the Observation above).
