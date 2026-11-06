---
name: acceptance-designer
description: "Turn a /to-spec spec and its /to-tickets tickets into BA-approved Gherkin acceptance scenarios with a traceability coverage matrix. Usage: /acceptance-designer <feature-slug>"
disable-model-invocation: true
---

# Acceptance Designer

Design acceptance scenarios for one feature from the local `/to-spec` and `/to-tickets` outputs. The Business Analyst (BA) owns the meaning of the requirements; you own the rigour. Every scenario is **traceable** to a requirement, and every requirement is **covered** by a scenario or an open question.

The spec and tickets are read-only inputs. Propose changes to them in the clarifications log; never edit them.

## Inputs and outputs

`<feature>` is the argument. With no argument, list the directories under `.scratch/` and ask which one.

| Path | Role |
| --- | --- |
| `.scratch/<feature>/spec.md` | Input: user stories, implementation decisions, testing decisions |
| `.scratch/<feature>/issues/<NN>-<slug>.md` | Input: one ticket each, with `Blocked by` and checkbox acceptance criteria |
| `.scratch/<feature>/acceptance/clarifications.md` | Output: questions, BA answers, proposed spec/ticket edits |
| `.scratch/<feature>/acceptance/features/<NN>-<slug>.feature` | Output: one Gherkin file per ticket |
| `.scratch/<feature>/acceptance/coverage-matrix.md` | Output: traceability matrix and gaps |

Write the scenarios and the matrix in the language of the spec, keeping Gherkin keywords in English (`Given`/`When`/`Then`), and use the project's domain glossary vocabulary.

## Process

### 1. Read and index

Read `spec.md` and every ticket. Stop and tell the user if either is missing. Assign stable **trace IDs**:

- `US-<n>`: user story n, by its number in the spec's User Stories list
- `T<NN>`: ticket NN, by its filename prefix
- `T<NN>-AC<k>`: the k-th acceptance criterion checkbox of ticket NN
- `TD-<n>`: the n-th Testing Decision bullet

Build the dependency graph from each ticket's `Blocked by`. Done when every story, criterion and testing decision has an ID and every blocking edge points at an existing ticket.

### 2. Audit

Hunt the **gaps** in the requirements. Check each item against every category, and log each hit as a question `Q<n>` with a proposed default so the BA can answer with a yes/no:

- **Vague**: unmeasurable words ("fast", "appropriate", "valid", "recent"), no actor, no observable outcome
- **Missing negative path**: nothing says what happens on invalid input, denied permission, failure or empty state
- **Missing boundary**: limits, thresholds, counts, formats or time windows left implicit
- **Orphan story**: a `US-n` no ticket criterion traces to
- **Orphan criterion**: a `T<NN>-AC<k>` that traces to no user story
- **Conflict**: criteria, tickets or spec sections that contradict each other, or a criterion that needs behaviour delivered by a ticket it is not blocked by
- **Untestable at the seam**: a criterion that the spec's Testing Decisions cannot observe as external behaviour

Done when every `US`, `T<NN>-AC<k>` and `TD` has been checked against every category and each finding is recorded in `clarifications.md` with its ID, category, the trace IDs it affects, the question and the proposed default.

### 3. Clarify with the BA

Present the questions, grouped by ticket, most blocking first. Ask the BA to answer each one: accept the default, give another answer, or defer. Record answers in `clarifications.md`.

Scenarios that depend on a deferred or unanswered question are drafted from the proposed default and tagged `@pending-Q<n>`.

Done when every question has a recorded state: answered, deferred or pending.

### 4. Generate scenarios

Write one `.feature` file per ticket, in ticket order (blockers first). Each file starts with a `Feature:` that restates the ticket's "What to build" from the user's perspective.

For every `T<NN>-AC<k>` derive:

- **Positive**: at least one scenario where the criterion holds
- **Negative**: the ways it can be violated or refused (invalid input, missing permission, failed dependency)
- **Edge**: each boundary, empty, maximum, duplicate, repeated or concurrent case the criterion implies

Scenario rules:

- Test external behaviour at the seam the spec's Testing Decisions name; leave out implementation details, file paths and UI mechanics.
- One behaviour per scenario. Use `Background` for shared preconditions and `Scenario Outline` with `Examples` for boundary tables.
- A scenario for a ticket with blockers states, in `Given`, the state those blocking tickets produce.
- Tag every scenario on the line above it: `@US-<n>` (one per story), `@T<NN>-AC<k>`, one of `@positive` / `@negative` / `@edge`, and `@pending-Q<n>` when applicable.
- Add `@TD-<n>` where a testing decision shaped the scenario.

```gherkin
@T02
Feature: Customer sees their order status

  Background:
    Given a customer with a placed order

  @US-4 @T02-AC1 @positive
  Scenario: Order status is shown after payment
    When the customer opens the order
    Then the order status is "Paid"

  @US-4 @T02-AC1 @negative @pending-Q3
  Scenario: Another customer's order is not visible
    Given a different customer
    When they open the first customer's order
    Then access is denied
```

Done when every criterion has at least one scenario, and every negative and edge case the audit flagged is present.

### 5. Build the coverage matrix

Write `coverage-matrix.md` with these sections:

1. **Header**: feature, date, approval status (`DRAFT` until step 6)
2. **Forward matrix**: one row per `US-n` and per `T<NN>-AC<k>`, with columns: trace ID, source text (short), ticket, scenario names and files, kinds covered (`positive`/`negative`/`edge`), open questions, status (`covered`, `partial`, `uncovered`, `pending`)
3. **Reverse check**: scenarios that carry no `@US` or `@T<NN>-AC` tag; each is either re-tagged or removed
4. **Gaps**: every `uncovered`, `partial` and `pending` row with the reason
5. **Counts**: stories, criteria, scenarios by kind, pending

Done when no row is `uncovered` without a matching open question, and the reverse check is empty.

### 6. BA approval

Show the BA the matrix summary, the gaps, and the scenarios per ticket. Ask for explicit approval, or for changes. Apply the changes, update the matrix, and repeat until the BA approves.

On approval, set the matrix header to `APPROVED <date>` with the approver's name as given by the BA, and list any scenarios still tagged `@pending-Q<n>`. Only an explicit approval from the BA flips the status; the user running the skill is not the BA unless they say so.

End with a report: files written, counts, open questions, and the proposed spec/ticket edits for the owner of `/to-spec`.
