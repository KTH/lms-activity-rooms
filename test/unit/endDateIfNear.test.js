const test = require('ava')
const rewire = require('rewire')

// Use rewire so we can test the function without having to export it
const lib = rewire('../../lib')
const functionUnderTest = lib.__get__('endDateIfNear')

test('endDateIfNear should return a date for activities in the near future', t => {
  const examDate = new Date()
  examDate.setDate(examDate.getDate() + 3)
  const activity = { date: examDate }

  const resultEndDate = functionUnderTest(activity)

  // Only check if it actually is a date
  t.true(resultEndDate instanceof Date)

  t.pass()
})
test('endDateIfNear should NOT return a date for activities in the far future', t => {
  const examDate = new Date()
  examDate.setDate(examDate.getDate() + 20)
  const activity = { date: examDate }

  const resultEndDate = functionUnderTest(activity)

  // should be undefined
  t.false(resultEndDate)

  t.pass()
})
