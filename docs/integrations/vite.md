# Vite Plugin

## Install

:::code-group

```bash [pnpm]
pnpm add -D @stylex-extend/core  @stylex-extend/vite
```

```bash [yarn]
yarn add -D @stylex-extend/core  @stylex-extend/vite
```

```bash [npm]
npm install -D @stylex-extend/core  @stylex-extend/vite
```

:::

Install the plugin:

```ts
// vite.config.ts
import { stylex } from '@stylex-extend/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    stylex()
  ]
})
```

## Usage

```ts
// in your application entry file.
import 'virtual:stylex.css'
```
