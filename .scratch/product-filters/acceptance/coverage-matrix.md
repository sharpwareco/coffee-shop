# Coverage matrix: product-filters

- Feature: product-filters (`.scratch/product-filters/spec.md`, tickets 01–05)
- Date: 2026-11-06
- Status: **APPROVED 2026-11-06** by the requester of this session, who accepted every recommendation in `clarifications.md` (Q1–Q12). The approver's name and BA role were not stated; confirm before using this as the BA sign-off.
- Pending scenarios: none (all questions answered with their proposed default)
- Scenario IDs `S<NN>.<m>` are in the scenario names in `features/<NN>-<slug>.feature`. `L` = `@logic` (observable at the filter function), `M` = `@manual` (checked in the browser). Product data in the scenarios is illustrative; real tests build their own inline arrays.

## Forward matrix: user stories

| Trace | Story (short) | Ticket(s) | Scenarios | Kinds | Status |
| --- | --- | --- | --- | --- | --- |
| US-1 | Filter by category | T01 | S01.2 L, S01.3 L, S01.7 M | + | covered |
| US-2 | Category defaults to All | T01 | S01.1 L, S01.8 M | + | covered |
| US-3 | Search by name | T02 | S02.1, .3, .4, .10, .12 L; S02.5 L; S02.18 M | + − edge | covered |
| US-4 | Search matches description | T02 | S02.2 L, S02.13 L | + edge | covered |
| US-5 | Search ignores case | T02 | S02.6 L, S02.7 L | + | covered |
| US-6 | Turkish İ/ı handled | T02 | S02.7, .8 L, S02.9 L | + − | covered |
| US-7 | Minimum price | T04 | S04.1, .3, .4, .6, .11, .12, .15 L; S04.18 M | + edge | covered |
| US-8 | Maximum price | T04 | S04.2, .3, .4, .11 L; S04.18 M | + edge | covered |
| US-9 | Dot or comma | T04 | S04.5 L | + | covered |
| US-10 | Only min or only max | T04 | S04.1 L, S04.2 L | + | covered |
| US-11 | "Only available" checkbox | T03 | S03.1, .3, .7 L; S03.8 M | + − edge | covered |
| US-12 | Filters combine (AND) | T02–T05 | S02.14, .15, S03.5, .6, S04.16, .17 L; S05.1, .2 M | + − | covered |
| US-13 | Filtered view in URL | T01, T05 | S01.10 M, S05.3 M | + | covered |
| US-14 | Back button restores state | T05 | S05.5 M, S05.6 M | + edge | covered |
| US-15 | Form shows current values | T01–T04 | S01.8, .9, S02.16, .17, S03.9, .10, S04.19, .20, S05.1 M | + − | covered |
| US-16 | "Showing X of Y products" | T01 | S01.11 L, S01.12 M, S01.13 M | + edge | covered |
| US-17 | Message when nothing matches | T01 | S01.14 M, S01.15 M, S02.5 L | − edge | covered |
| US-18 | "Clear filters" on empty result | T01, T05 | S01.14 M, S01.15 M, S05.4 M | + − | covered |
| US-19 | "Clear" next to the form | T01, T05 | S01.7 M, S01.16 M, S05.4 M | + | covered |
| US-20 | Min above max gives empty | T04 | S04.13 L, S04.14 M | − | covered |
| US-21 | Invalid input ignored | T04, T05 | S04.7, .8, .10 L; S02.17, S04.20, S05.12, .13 M | − edge | covered |
| US-22 | Unknown category = All | T01, T05 | S01.4 L, S01.6 L, S01.9 M, S05.12 M | − edge | covered |
| US-23 | Repeated params handled | T01–T05 | S01.5, S02.11, S03.4, S04.9 L; S05.12 M | − | covered |
| US-24 | Unavailable stay visible | T03 | S03.2 L | + | covered |
| US-25 | Form wraps on phones | T05 | S05.10 M, S05.11 M | + edge | covered |
| US-26 | Labels, Enter submits | T05 | S05.7, .8, .9 M | + edge | covered |
| US-27 | Pure function, no mutation | T01 | S01.18 L | edge | covered |
| US-28 | Server-side, no client JS | T01 | S01.17 M | + | covered |

## Forward matrix: ticket acceptance criteria

| Trace | Criterion (short) | Scenarios | Status |
| --- | --- | --- | --- |
| T01-AC1 | Old attempt discarded | n/a | non-behavioural (tooling), Q2 |
| T01-AC2 | Form with category select, Apply, Clear | S01.7 M, S01.16 M | covered |
| T01-AC3 | drink / food / none | S01.1–.3 L, S01.10 M | covered |
| T01-AC4 | Unknown or repeated category = All | S01.4–.6 L | covered |
| T01-AC5 | Form pre-filled with category | S01.8 M, S01.9 M | covered |
| T01-AC6 | "Showing X of Y products" | S01.11 L, S01.12–.13 M | covered |
| T01-AC7 | Empty state and "Clear filters" | S01.14 M, S01.15 M | covered |
| T01-AC8 | Server-side, no client component | S01.17 M | covered |
| T01-AC9 | Pure, no mutation, unit tests | S01.18 L (behaviour); unit-test part is tooling | covered |
| T01-AC10 | `npm test`, lint, manual check | n/a | non-behavioural (tooling), Q2 |
| T02-AC1 | `q` parameter and labelled input | S02.18 M | covered |
| T02-AC2 | Name or description substring | S02.1–.5 L, S02.12 L, S02.13 L | covered |
| T02-AC3 | Case and Turkish I | S02.6–.9 L | covered |
| T02-AC4 | Empty, whitespace, repeated `q` | S02.10 L, S02.11 L | covered |
| T02-AC5 | Combines with category | S02.14 L, S02.15 L | covered |
| T02-AC6 | Input pre-filled, count, empty state | S02.16 M, S02.17 M, S01.14 M | covered |
| T02-AC7 | Unit tests | n/a | non-behavioural (tooling), Q2 |
| T02-AC8 | `npm test`, lint, manual check | n/a | non-behavioural (tooling), Q2 |
| T03-AC1 | `available` parameter and checkbox | S03.8 M | covered |
| T03-AC2 | Only `1` turns it on | S03.3 L, S03.4 L | covered |
| T03-AC3 | Hides / keeps unavailable | S03.1 L, S03.2 L, S03.7 L | covered |
| T03-AC4 | Checkbox reflects state | S03.9 M, S03.10 M | covered |
| T03-AC5 | Combines, count, empty state | S03.5 L, S03.6 L | covered |
| T03-AC6 | Own product arrays with unavailable items | n/a | non-behavioural (tooling), Q2 |
| T03-AC7 | `npm test`, lint, manual check | n/a | non-behavioural (tooling), Q2 |
| T04-AC1 | `min` / `max` parameters and inputs in lira | S04.18 M | covered |
| T04-AC2 | Accepted shapes, rest ignored | S04.5, .7–.9, .11, .12, .15 L | covered |
| T04-AC3 | Blank is not treated as zero | S04.10 L | covered |
| T04-AC4 | Exact cents conversion | S04.6 L | covered |
| T04-AC5 | Inclusive; only-min and only-max | S04.1–.4 L | covered |
| T04-AC6 | Min above max = empty, not corrected | S04.13 L, S04.14 M | covered |
| T04-AC7 | Inputs pre-filled with valid values | S04.14 M, S04.19 M, S04.20 M | covered |
| T04-AC8 | Combines with other filters | S04.16 L, S04.17 L | covered |
| T04-AC9 | Unit tests | n/a | non-behavioural (tooling), Q2 |
| T04-AC10 | `npm test`, lint, manual check | n/a | non-behavioural (tooling), Q2 |
| T05-AC1 | All four filters in one URL | S05.1–.3 M | covered |
| T05-AC2 | Clear and Clear filters | S05.4 M | covered |
| T05-AC3 | Back / forward | S05.5 M, S05.6 M | covered |
| T05-AC4 | Enter submits, visible labels | S05.7–.9 M | covered |
| T05-AC5 | Narrow viewport | S05.10 M, S05.11 M | covered |
| T05-AC6 | Malformed URLs never error | S05.12 M, S05.13 M | covered |
| T05-AC7 | Admin and API unchanged | S05.14 M, S05.15 M | covered |
| T05-AC8 | `npm test`, lint, build | n/a | non-behavioural (tooling), Q2 |
| T05-AC9 | Defects fixed or ticketed | n/a | non-behavioural (process), Q2 |

## Reverse check

Every scenario carries at least one `@US-n` and one `@T<NN>-AC<k>` tag, except two:

- S05.14 and S05.15 (admin list and products API unchanged) carry only `@T05-AC7`. They trace to the spec's Implementation Decisions ("admin product table and products API untouched") and to no numbered user story. Kept as is.

## Gaps

No `uncovered`, `partial` or `pending` rows. Notes:

- 10 criteria are `non-behavioural` (Q2): T01-AC1, T01-AC10, T02-AC7, T02-AC8, T03-AC6, T03-AC7, T04-AC9, T04-AC10, T05-AC8, T05-AC9.
- 35 of 81 scenarios are `@manual`: the spec automates only the pure filter function (TD-2, Q1).
- Story kinds: US-9, US-24 and US-28 have a positive scenario only; US-27 an edge scenario only; US-20 a negative only. Nothing further is derivable from the spec for these.
- Not derived, since the spec does not define them: an upper-case category value such as `DRINK`, and unavailable-only filtering (explicitly out of scope).

## Counts

| Item | Count |
| --- | --- |
| User stories | 28, all covered |
| Acceptance criteria | 44: 34 covered, 10 non-behavioural |
| Scenarios | 81 (T01 18, T02 18, T03 10, T04 20, T05 15) |
| By kind | 38 positive, 24 negative, 19 edge |
| By seam | 46 `@logic`, 35 `@manual` |
| Pending (`@pending-Q`) | 0 |
