import postcss from "postcss"
import {pseudoClasses, replaceRuleSelector} from "./replaceRuleSelector"

function explodeSelectors(options = {}) {
  const ruleContainsPseudoClass = (rule) => {
    return pseudoClasses.some(pC => rule.selector.includes(pC))
  }

  return (css) => {
    css.walkRules(rule => {
      if (rule.selector && ruleContainsPseudoClass(rule)) {
        rule.selector = replaceRuleSelector(rule, options)
      }
    })
  }

}

export default postcss.plugin("postcss-selector-matches", explodeSelectors)
