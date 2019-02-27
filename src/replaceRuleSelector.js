import list from "postcss/lib/list"

import balancedMatch from "balanced-match"

const pseudoClasses = [":is", ":matches"]
const selectorElementRE = /^[a-zA-Z]/

function isElementSelector(selector) {
  return selectorElementRE.exec(selector)
}

function normalizeSelector(selector, preWhitespace, pre) {
  return isElementSelector(selector) && !isElementSelector(pre)
    ? `${ preWhitespace}${ selector }${ pre }`
    : `${ preWhitespace }${ pre }${ selector }`
}

function explodeSelector(selector, options) {
  if (selector && pseudoClasses.some(pC => selector.includes(pC))) {
    let newSelectors = []
    const preWhitespaceMatches = selector.match(/^\s+/)
    const preWhitespace = preWhitespaceMatches ? preWhitespaceMatches[0] : ""
    const selectorPart = list.comma(selector)

    selectorPart.forEach(part => {
      const positions = pseudoClasses
        .map(pC => part.indexOf(pC))
        .filter(index => index > -1)
      const position = positions.length ? positions[0] : -1
      const pre = part.slice(0, position)
      const body = part.slice(position)
      const matches = balancedMatch("(", ")", body)

      const bodySelectors = matches && matches.body
        ? list
          .comma(matches.body)
          .reduce((acc, s) => [...acc, ...explodeSelector(s, options)], [])
        : [body]

      const postSelectors = matches && matches.post
        ? explodeSelector(matches.post, options)
        : []

      let newParts
      if (postSelectors.length === 0) {
        const normalizeSelectors = s => normalizeSelector(s, preWhitespace, pre)

        // TODO: this is a poor way to try we are facing a piece of a selector…
        newParts = position === -1 || pre.indexOf(" ") > -1
          ? bodySelectors.map((s) => preWhitespace + pre + s)
          : newParts = bodySelectors.map(normalizeSelectors)
      }
      else {
        newParts = []
        postSelectors.forEach(postS => {
          bodySelectors.forEach(s => {
            newParts.push(preWhitespace + pre + s + postS)
          })
        })
      }
      newSelectors = [
        ...newSelectors,
        ...newParts,
      ]
    })

    return newSelectors
  }

  return [selector]
}

function replaceRuleSelector(rule, options) {
  const indentation = rule.raws && rule.raws.before
    ? rule.raws.before.split("\n").pop()
    : ""
  return (
    explodeSelector(rule.selector, options)
      .join("," + (options.lineBreak ? "\n" + indentation : " "))
  )
}

export {
  pseudoClasses,
  replaceRuleSelector,
}
