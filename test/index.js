import tape from "tape"

import postcss from "postcss"
import plugin from "../src"
import {pseudoClasses, replaceRuleSelector} from "../src/replaceRuleSelector"

function transform(css, options = {}) {
  return postcss(plugin(options)).process(css).css
}

pseudoClasses.forEach((pc) => {
  tape(`postcss-selector-${pc.slice(1)}`, t => {
    t.ok(
      typeof replaceRuleSelector === "function",
      "expose 'replaceRuleSelector' function (for postcss-custom-selectors)"
    )

    t.equal(
      transform("body {}"),
      "body {}",
      `should do nothing if there is no ${pc}`
    )

    t.equal(
      transform(`body, ${pc.slice(1)} {}`),
      `body, ${pc.slice(1)} {}`,
      `should really do nothing if there is no ${pc}`
    )

    t.equal(
      transform(`${pc}(a, b) {}`),
      "a, b {}",
      `should transform simple ${pc}()`
    )

    t.equal(
      transform(`tag${pc}(.class, .class2) {}`),
      "tag.class, tag.class2 {}",
      `should transform directes ${pc}()`
    )

    t.equal(
      transform(`tag ${pc}(tag2, tag3) {}`),
      "tag tag2, tag tag3 {}",
      `should transform ${pc}()`
    )

    t.equal(
      transform(`tag ${pc}(tag2, tag3) ${pc}(tag4, tag5) {}`),
      "tag tag2 tag4, tag tag3 tag4, tag tag2 tag5, tag tag3 tag5 {}",
      `should transform multiples ${pc}()`
    )

    t.equal(
      transform(`tag ${pc}(tag2, tag3) ${pc}(tag4, tag5), test {}`),
      "tag tag2 tag4, tag tag3 tag4, tag tag2 tag5, tag tag3 tag5, test {}",
      `should transform multiples ${pc}() with stuff after`
    )

    t.equal(
      transform(`${pc}(tag) ${pc}(tag2, tag3):hover {}`),
      "tag tag2:hover, tag tag3:hover {}",
      `should transform multiples ${pc}() with pseudo after`
    )

    t.equal(
      transform(`tag ${pc}(tag2 ${pc}(tag4, tag5), tag3) {}`),
      "tag tag2 tag4, tag tag2 tag5, tag tag3 {}",
      `should transform ${pc}() recursively`
    )

    t.equal(
      transform(`p${pc}(a, span) {}`),
      "pa, pspan {}",
      "should transform shit if you ask for shit ?"
    )

    t.equal(
      transform(`.foo${pc}(:nth-child(-n+2), .bar) {}`),
      ".foo:nth-child(-n+2), .foo.bar {}",
      "should transform childs with parenthesis"
    )

    t.equal(
      transform(`a${pc}(
    .b,
    .c
  ) {}`),
      "a.b, a.c {}",
      "should work with lots of whitespace"
    )

    t.equal(
      transform(`.foo${pc}(:nth-child(-n+2), .bar) {}`, {lineBreak: true}),
      ".foo:nth-child(-n+2),\n.foo.bar {}",
      "should add line break if asked too"
    )

    t.equal(
      transform(`  .foo${pc}(:nth-child(-n+2), .bar) {}`, {lineBreak: true}),
      "  .foo:nth-child(-n+2),\n  .foo.bar {}",
      "should add line break if asked too, and respect indentation"
    )

    t.equal(
      transform(`\n  .foo${pc}(:nth-child(-n+2), .bar) {}`, {lineBreak: true}),
      "\n  .foo:nth-child(-n+2),\n  .foo.bar {}",
      "should add line break if asked too, and respect indentation even with \n"
    )

    t.equal(
      transform(`
button${pc}(:hover, :active),
.button${pc}(:hover, :active) {}`),
      `
button:hover, button:active, .button:hover, .button:active {}`,
      "should avoid duplicates"
    )

    t.equal(
      transform(`.foo${pc}(:hover, :focus)::before {}`),
      ".foo:hover::before, .foo:focus::before {}",
      `should work with something after ${pc}()`
    )

    t.equal(
      transform(`article ${pc}(h1, h2, h3) + p {}`),
      "article h1 + p, article h2 + p, article h3 + p {}",
      "should work correctly with adjacent selectors"
    )

    t.equal(
      transform(`article ${pc}(h1, h2, h3) + p {}`, {lineBreak: true}),
      `article h1 + p,
article h2 + p,
article h3 + p {}`,
      "should work correctly with adjacent selectors and line break"
    )

    t.equal(
      transform(`.foo${pc}(p) {color: red;}`),
      "p.foo {color: red;}",
      "should work correctly with a class and an element"
    )

    t.equal(
      transform(`.fo--oo > ${pc}(h1, h2, h3) {}`),
      ".fo--oo > h1, .fo--oo > h2, .fo--oo > h3 {}",
      "regression https://github.com/postcss/postcss-selector-matches/issues/10"
    )

    t.equal(
      transform(`${pc}(h4, h5, h6):hover .ba--z {}`),
      "h4:hover .ba--z, h5:hover .ba--z, h6:hover .ba--z {}",
      "regression https://github.com/postcss/postcss-selector-matches/issues/10"
    )

    t.equal(
      transform(`${pc}(a, b).foo, .bar {}`),
      "a.foo, b.foo, .bar {}",
      "regression https://github.com/postcss/postcss-selector-matches/issues/10"
    )

    t.end()
  })
})
