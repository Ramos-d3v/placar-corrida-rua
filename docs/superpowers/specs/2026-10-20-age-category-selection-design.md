# Age Category Selection Design

## Goal

Remove the unfiltered category choice from the results page while keeping the age-range categories available for both genders.

## Current behavior

The category selector contains exact gender-and-age values such as `F35-39` and `M35-39`, plus an empty-value “Todas as categorias” option. The gender tabs independently select a general ranking, and changing a tab clears the selected category.

## Design

- Keep the Feminino and Masculino tabs and the existing age ranges: `15-19`, `20-24`, `25-29`, `30-34`, `35-39`, `40-44`, `45-49`, `50-54`, `55-59`, `60-64`, and `65+`.
- Keep category values as exact gender-prefixed API codes, displayed as readable gender-and-age labels.
- Remove “Todas as categorias”; the selector always has a specific category selected. Initially select Feminino · 15–19.
- Selecting a category selects its corresponding gender tab. Switching tabs selects the same age range for the other gender, so the gender tab and category remain synchronized.
- Continue sending the exact category code and matching gender to the API, use category rankings, and reset pagination when the selected category changes.
- Leave search, loading, errors, pagination, result presentation, and the API contract unchanged.
- Update `plan/plan.prompt.md` to describe the required initial category and synchronized gender/category controls instead of an unfiltered category choice.

## Alternatives considered

1. **Keep gender tabs and exact age categories synchronized (selected):** preserves the existing API contract and keeps both controls useful without an unfiltered state.
2. **Show age ranges without gender:** would require combining results or extending the API, which is unsupported by the current exact-match category filter.
3. **Remove the gender tabs:** simplifies the controls but unnecessarily changes existing navigation.

## Validation

- Run `npm run lint` and `npm run build`.
- Confirm that no “Todas as categorias” option remains and the initial selection is Feminino · 15–19.
- Confirm that selecting a category updates the gender tab and that changing tabs keeps the age range while switching to the matching gender code.
- Confirm the selected category continues to drive exact category and gender API parameters, and pagination resets when the selection changes.
