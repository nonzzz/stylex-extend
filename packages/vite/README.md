# @stylex-extend/vite

Experimental vite plugin

## Quick Start

### Install

```bash
npm install --dev @stylex-extend/vite
```

### Usage

```ts
import { stylex } from '@stylex-extend/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // ... your plugins
    stylex()
  ]
})
```

## Options

| params           | type                                          | default                                     | description                                          |
| ---------------- | --------------------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| `include`        | `string \| RegExp \| Array<string \| RegExp>` | `/\.(mjs\|js\|ts\|vue\|jsx\|tsx)(\?.*\|)$/` | Include all assets matching any of these conditions. |
| `exclude`        | `string \| RegExp \| Array<string \| RegExp>` | `-`                                         | Exclude all assets matching any of these conditions. |
| `importSources`  | `string[]`                                    | `['stylex', '@stylexjs/stylex']`            | See stylex document.                                 |
| `babelConfig`    | `object`                                      | `{}`                                        | Babel config for stylex                              |
| `useCSSLayers`   | `boolean`                                     | `false`                                     | See stylex document                                  |
| `optimizedDeps`  | `Array<string>`                               | `[]`                                        | Work with external stylex files or libraries         |
| `macroTransport` | `false \|object`                              | `'props'`                                   | Using stylex extend macro                            |

## Author

Kanno

## LICENSE

[MIT](./LICENSE)
