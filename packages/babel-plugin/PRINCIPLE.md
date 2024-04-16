# Principle

Welcome to `@stylex-extend/babel-plugin`. This is an unofficial `@stylexjs` extension. We support using `JSXAttribute` syntax to define inline style and etc.

All of features are based on the `@stylexjs` RFC or some interesting ideas.

## Features

> JSXAttribute

```jsx

// acceptable syntax

const color = 'red'

function font(unit) {
    return ...
}

function Component(props) {

return <div stylex={{
    color,
    font: font(1),
    height: props.full ? '100px' : '50px', 
    
    padding: `${props.padding}`,
    ...(props.inline && {display:'inline'}),
    margin: {
        default: '10px'
    }
}}></div>
}

// We don't support overly complex syntax. don't write nested spreads syntax.

```
