# @stylex-extend/postcss

## Quick Start

### Install

```bash
yarn add @stylex-extend/postcss autoprefixer -D
```

### Usage

```js
// .babelrc.js

module.exports = {
  plugins: ['@stylex-extend/babel-plugin', '@stylexjs/babel-plugin']
}
```

Add the following to your postcss.config.js

```js
module.exports = {
  plugins: {
    '@stylex-extend/postcss': {
      include: ['src/**/*.{js,jsx,ts,tsx}']
    },
    autoprefixer: {}
  }
}
```
