# Event Category Filters Design

## Goal

Make the frontend understand the event category codes used by the supplied race results. A category code consists of a sex prefix (`F` or `M`) followed by an age range, for example `F35-39` or `M35-39`.

## Current behavior

- The frontend offers a hard-coded list of five age ranges that do not match the supplied event.
- It sends the selected age range directly as the API's `category` parameter.
- The API contract filters `category` by exact text, while the supplied results use combined codes such as `F35-39`.
- The results table and participant detail display the raw category code.

## Design

### Category model and labels

Keep the exact category code as the value sent to the API. For this event, use the age ranges present in the supplied payload: `15-19`, `20-24`, `25-29`, `30-34`, `35-39`, `40-44`, `45-49`, `50-54`, `55-59`, `60-64`, and `65+`. Pair each range with both category prefixes to produce the available selection values.

Present category choices and participant categories as readable labels, for example `Feminino · 35–39 anos` and `Masculino · 35–39 anos`. Recognize `F` and `M` without changing the original code used in API requests. Unknown or empty category values must remain visible as received rather than being converted to a fabricated category.

### Filters and API requests

- Keep only the Feminino and Masculino tabs, with Feminino selected initially.
- Replace the incompatible age-only choices with exact sex-and-age category choices.
- Selecting a category sets both the category code and its corresponding gender tab. The request sends the exact category code and the gender value used by the supplied payload (`FEMININO` or `MASCULINO`).
- Selecting Feminino or Masculino clears any selected exact category, so the two controls never present conflicting filters.
- Keep pagination, search, request cancellation, loading, and error behavior unchanged. Reset to page 1 whenever either filter changes.
- Continue to use `rank_category` for a selected exact category and `rank_general` when no exact category is selected.

The frontend cannot offer an age-only filter across both sexes with the current API contract: `category` is exact-match and does not provide a category catalog or an age-range query. Adding that behavior would require a separate API change and is outside this design.

### Documentation and responsive behavior

Update the existing project plan that documents the old age bands so it describes the combined category codes and exact API filtering. Keep the current responsive filter layout usable on narrow screens; category labels may be longer than the existing age-only options.

## Validation

- Run `npm run lint` and `npm run build`.
- Verify the page initially selects Feminino, and the only gender tabs are Feminino and Masculino.
- Verify selecting a feminine category sends `gender=FEMININO` and the exact category such as `F35-39`; verify the masculine equivalent sends `gender=MASCULINO` and `M35-39`.
- Verify switching gender tabs clears the exact category and resets pagination to page 1.
- Verify table and participant-detail category labels decode known prefixes and ranges, while unknown category values remain visible.
- Verify the filter remains usable at the existing narrow-screen breakpoint.

## Scope

This change is limited to the frontend's category selection and display plus the directly related project-plan documentation. It does not change the API contract, rankings, result payload, or the age ranges used by other events.
