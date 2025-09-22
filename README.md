# Universal Filters

Lightweight plugin adding one debounced search input to the List view (injection point: `beforeActionButtons`). It builds a single OR filter across configured columns.

## Install

```bash
npm install @adminforth/universal-search
```

## Usage

```ts
import UniversalFiltersPlugin from '@adminforth/universal-search';

plugins: [
  new UniversalFiltersPlugin({
    columns: [
      { name: 'title' },
      { name: 'description' },
      { name: 'country', caseSensitive: true },
      { name: 'price', exact: true },
    ],
    debounceMs: 400,
  })
]
```

Full docs & advanced options: see AdminForth docs (Plugins -> Universal Filters).

## License

MIT
