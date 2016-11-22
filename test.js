const test = require('tape')
const multidrive = require('./')

test('should assert input types', function (t) {
  t.plan(1)
  t.throws(multidrive)
})
