const babel = require('@babel/core')
const stylexBabelPlugin = require('@stylexjs/babel-plugin')

// Creates a stateful bundler for processing StyleX rules using Babel.
module.exports = function createBundler() {
  const styleXRulesMap = new Map()
  const globalCSS = {}

  // Determines if the source code should be transformed based on the presence of StyleX imports.
  function shouldTransform(sourceCode) {
    return sourceCode.includes('stylex')
  }

  // Transforms the source code using Babel, extracting StyleX rules and storing them.
  async function transform(id, sourceCode, babelConfig, options) {
    const { isDev, shouldSkipTransformError } = options
    const { code, map, metadata } = await babel
      .transformAsync(sourceCode, {
        filename: id,
        caller: {
          name: '@stylexjs/postcss-plugin',
          isDev
        },
        ...babelConfig
      })
      .catch((error) => {
        if (shouldSkipTransformError) {
          console.warn(
            `[@stylexjs/postcss-plugin] Failed to transform "${id}": ${error.message}`
          )

          return { code: sourceCode, map: null, metadata: {} }
        }
        throw error
      })

    const stylex = metadata.stylex
    if (stylex != null && stylex.length > 0) {
      styleXRulesMap.set(id, stylex)
    }

    const globalStyle = metadata.globalStyle

    if (globalStyle && globalStyle.length > 0) {
      globalCSS[id] = globalStyle
    }

    return { code, map, metadata }
  }

  // Removes the stored StyleX rules for the specified file.
  function remove(id) {
    styleXRulesMap.delete(id)
  }

  //  Bundles all collected StyleX rules into a single CSS string.
  function bundle({ useCSSLayers }) {
    const rules = Array.from(styleXRulesMap.values()).flat()

    const css = stylexBabelPlugin.processStylexRules(rules, useCSSLayers) + '\n' + Object.values(globalCSS).join('\n')

    return css
  }

  return {
    shouldTransform,
    transform,
    remove,
    bundle
  }
}
