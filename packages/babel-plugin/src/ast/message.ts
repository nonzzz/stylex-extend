export const MESSAGES = {
  NOT_IMPLEMENTED: 'Not implemented.',
  INVALID_CSS_AST_KIND: 'Only accept a style object.',
  INVALID_JSX_ELEMENT: 'Invalid JSX element.',
  DUPLICATE_STYLEX_ATTR: 'Duplicate stylex attribute.',
  NO_STATIC_ATTRIBUTE: 'Only static attribute is allowed in style object.',
  NO_NESTED_SPREAD: 'Nested spread syntax is not allowed in style object.',
  ONLY_LOGICAL_AND: 'Only logical and operator is allowed in spread element.',
  INVALID_SPREAD_SIDE: 'Only object expression is allowed on the right side of the spread element.',
  INVALID_ATTRS_KIND: "Only object expression is allowed for jsx attribute 'stylex'",
  INLINE_ONLY_ONE_ARGUMENT: 'function inline() only accept one argument.',
  GLOBAL_STYLE_ONLY_ONE_ARGUMENT: 'function injectGlobalStyle() only accept one argument.',
  IMPORT_EXTEND_PKG_ERROR: "'@stylex-extend/core' only support named import.",
  INVALID_FILE: 'Invalid file path',
  ONLY_TOP_LEVEL_INJECT_GLOBAL_STYLE: 'function injectGlobalStyle() must be called at the top level of the module.',
  INVALID_CSS_TOKEN: 'Invalid css token.',
  INVALID_INLINE_ARGUMENT: 'Invalid inline argument.'
}
