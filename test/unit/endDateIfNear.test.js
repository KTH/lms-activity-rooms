const test = require('ava')
const rewire = require('rewire')

// Use rewire so we can test the function without having to export it
const lib = rewire('../../lib')
// __get__ is a special rewire function
const functionUnderTest = lib.__get__('endDateIfNear')

const NUM_OF_DAYS_TO_USE_FOR_ENDDATE = lib.__get__(
  'NUM_OF_DAYS_TO_USE_FOR_ENDDATE'
)
// const NUM_OF_DAYS_FORWARD_TO_HANDLE = lib.__get__(
//   'NUM_OF_DAYS_FORWARD_TO_HANDLE'
// )

test('endDateIfNear should return a date for activities in the near future', t => {
  const now = new Date()

  const examDate = new Date(now.getTime())
  examDate.setDate(examDate.getDate() + 3)
  const activity = { date: examDate }

  const endDate = functionUnderTest(activity)

  const expectedEndDate = new Date(examDate.getTime())
  expectedEndDate.setDate(
    expectedEndDate.getDate() + NUM_OF_DAYS_TO_USE_FOR_ENDDATE
  )

  t.deepEqual(endDate, expectedEndDate)

  t.pass()
})
