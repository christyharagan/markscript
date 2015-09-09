var speckle = require('speckle')
var rule = speckle.rule
var variable = speckle.variable
var prefix = speckle.prefix
//import {rule, variable, prefix} from 'speckle'

exports.logicRuleSet = function() {
  var logic = prefix('l', 'http://logic/')
  var a = variable('a')
  var b = variable('b')
  var ab = variable('ab')
  var notAB = variable('notAB')
  var is = logic.uri('is')
  var T = logic.uri('true')
  var F = logic.uri('false')
  var NOT = logic.uri('not')
  var AND = logic.uri('and')
  var OR = logic.uri('or')
  var IMPLIES_LEFT = logic.uri('leftImplies')
  var IMPLIES_RIGHT = logic.uri('rightImplies')

  return {
    path: '/rules/logic.rules',
    rules: rule('negationTa')
      .when(a, is, T)
      .and(a, NOT, b)
      .then(b, is, F)

      .rule('negationTb')
      .when(b, is, T)
      .and(a, NOT, b)
      .then(a, is, F)

      .rule('negationFa')
      .when(a, is, F)
      .and(a, NOT, b)
      .then(b, is, T)

      .rule('negationFb')
      .when(b, is, F)
      .and(a, NOT, b)
      .then(a, is, T)

      .rule('conjunction')
      .when(ab, is, T)
      .and(ab, AND, a)
      .then(a, is, T)

      .rule('disjunction')
      .when(ab, is, F)
      .and(ab, OR, a)
      .then(a, is, F)

      .rule('modusPollens')
      .when(ab, is, T)
      .and(ab, IMPLIES_LEFT, a)
      .and(ab, IMPLIES_RIGHT, b)
      .and(a, is, T)
      .then(b, is, T)

      .rule('modusTollens')
      .when(ab, is, T)
      .and(ab, IMPLIES_LEFT, a)
      .and(ab, IMPLIES_RIGHT, b)
      .and(b, is, F)
      .then(a, is, F)

      .rule('conjunctiveSyllogism')
      .when(ab, is, F)
      .and(ab, AND, a)
      .and(ab, AND, b)
      .and(a, is, T)
      .then(b, is, F)

      .rule('disjunctiveSyllogism')
      .when(ab, is, T)
      .and(ab, OR, a)
      .and(ab, OR, b)
      .and(a, is, F)
      .then(b, is, T)

      .toSparql()
  }
}
