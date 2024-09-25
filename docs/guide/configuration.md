# Configuration

Currently it only provide [vite integration](../integrations/vite.md). If you use other tools, you can also integrate them manually.

The following are the useful packages included in the project

## @stylex-extend/babel-plugin

### Configuration Options

<p />

#### transport

- Type: `Transport`
- Default: `true`

Specifying this in config will translate JSXAttribute `stylex`.

```ts
export type Transport = 'props' | 'attrs'
```

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
