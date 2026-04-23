# AdminForth Universal Search Plugin

<img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /> <img src="https://woodpecker.devforth.io/api/badges/3848/status.svg" alt="Build Status" /> <a href="https://www.npmjs.com/package/@adminforth/universal-search"><img src="https://img.shields.io/npm/dm/@adminforth/universal-search" alt="npm downloads" /></a> <a href="https://www.npmjs.com/package/@adminforth/universal-search"><img src="https://img.shields.io/npm/v/@adminforth/universal-search" alt="npm version" /></a>

[![Ask AI](https://tluma.ai/badge)](https://tluma.ai/ask-ai/devforth/adminforth)

Lightweight plugin adding one debounced search input to the List view (injection point: `beforeActionButtons`). It builds a single OR filter across configured columns.

## Features

- Add one debounced search input to AdminForth list views.
- Search across configured columns with a single query.
- Help teams find records faster in large back offices.
- Keep cross-column discovery close to the list screen.

## Documentation

Full setup and configuration guide:

[AdminForth Universal Filters Documentation](https://adminforth.dev/docs/tutorial/Plugins/universal-search/)

## About AdminForth

AdminForth is an open-source, agent-first admin framework for building robust admin panels and back-office applications faster.

## Related links

- [AdminForth website](https://adminforth.dev)
- [npm package](https://www.npmjs.com/package/@adminforth/universal-search)
- [More AdminForth plugins](https://adminforth.dev/docs/tutorial/ListOfPlugins/)
- [Built by DevForth](https://devforth.io)

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
