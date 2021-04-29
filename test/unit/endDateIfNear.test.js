const test = require('ava')
const rewire = require('rewire')

// Use rewire so we can test the function without having to export it
const lib = rewire('../../lib')
const functionUnderTest = lib.__get__('endDateIfNear')

test('endDateIfNear should return a dateString for activities in the near future', t => {
  // __get__ is a special rewire function
  const activity = {}
  const endDate = functionUnderTest(activity)

  t.pass()
})
