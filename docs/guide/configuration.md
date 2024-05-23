# Configuration

Currently it only provides [`Vite`](https://github.com/nonzzz/vite-plugin-stylex) integration. If you use other tools, you can also integrate them manually.

The following are the useful packages included in the project

## @stylex-extend/babel-plugin

### Configuration Options

<p />

#### stylex

- Type: `boolean | StylexBindingMeta`
- Default: `true`

Specifying this in config will translate JSXAttribute `stylex`.

```ts
export interface StylexBindingMeta {
  helper: 'props' | 'attrs' | (string & {})
}
```

#### enableInjectGlobalStyle

- Type: `boolean`
- Default: `true`

Sometimes you might want to insert gobal css. You can use the `injectGlobalStyle` to do this.
It's support css variables defined in `stylex.defineVars`.

#### aliases

- Type: `Record<string, string | string[]>`
- Default: `{}`

Allows you to alias project directories to absolute paths, making it easier to import modules.

## @stylex-extend/core

Provides a collection of experimental APIs.

## @stylex-extend/react

Provide LSP support for react jsx.

## @stylex-extend/vue

Provide LSP support for vue jsx.
