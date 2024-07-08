// reference: https://github.com/facebook/stylex/issues/536
// TL;DR: I have not plan to implement the same api in stylex-extend
// Currently support API's
// - ancestor (a b)
// - descendent (a:has(b))
// - sibling (a + b)
// Now stylx compiler don't support it. So we should collect them and do a pre evaluate.

export function transformWhen() {}
