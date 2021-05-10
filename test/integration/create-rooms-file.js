require('dotenv').config()
const test = require('ava')
const nock = require('nock')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { writeActivities } = require('../../lib')

const getHeader = fileName => {
  return fs
    .readFileSync(fileName, { encoding: 'utf-8' })
    .split('\n')[0]
    .split(',')
}

/**
 * Testing that, given that API responses are as defined this function
 * should successfully write certain files to a certain directory
 * with a predefined strucuture in .cvs format.
 */

test.before(async t => {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exams-'))
  /**
   * Context is a good practice for writing DRY code
   */
  t.context = {
    mock: fs.readFileSync(
      path.resolve('test', 'integration', 'files', 'mock.json'),
      { encoding: 'utf-8' }
    ),
    files: {
      courses: path.resolve(dir, 'lms-activity-rooms.courses.csv'),
      sections: path.resolve(dir, 'lms-activity-rooms.sections.csv'),
      examiners: path.resolve(dir, 'lms-activity-rooms.examiners.csv'),
      students: path.resolve(dir, 'lms-activity-rooms.students.csv')
    }
  }
  /**
   * This will intercept any fetch requests made and reply with our mock
   */
  nock(`${process.env.AKTIVITETSTILLFALLEN_API_URL}/aktivitetstillfallen`)
    .get('/students')
    .query(true)
    .reply(200, JSON.parse(t.context.mock))
    .persist()
  /** make sure that every computer that runs these tests uses the same
   * settings
   */
  process.env.BLUEPRINT_SIS_ID = 'exam_bp_2020_p0'

  /**
   * Running the integration test
   */
  await writeActivities(
    new Date('August 1, 2020 23:15:30'),
    new Date('August 15, 2020 23:15:30'),
    dir
  )
})

/**
 * Each test reads file that should exists and compares with snapshot
 * given that they match and file exists the test passes.
 */
test('Generating lms-activity-rooms.courses.csv', async t => {
  const content = fs.readFileSync(t.context.files.courses, {
    encoding: 'utf-8'
  })
  t.snapshot(content)
})
test('Generating lms-activity-rooms.sections.csv', async t => {
  const content = fs.readFileSync(t.context.files.sections, {
    encoding: 'utf-8'
  })
  t.snapshot(content)
})
test('Generating lms-activity-rooms.examiners.csv', async t => {
  const content = fs.readFileSync(t.context.files.examiners, {
    encoding: 'utf-8'
  })
  t.snapshot(content)
})
test('Generating lms-activity-rooms.students.csv', async t => {
  const content = fs.readFileSync(t.context.files.students, {
    encoding: 'utf-8'
  })
  t.snapshot(content)
})

/**
 * Testing the structural integrity of our headers in the cvs files.
 */
test('Structural integrity of courses files', t => {
  const { courses } = t.context.files
  t.deepEqual(getHeader(courses), [
    'course_id',
    'short_name',
    'long_name',
    'account_id',
    'status',
    'blueprint_course_id'
    // 'end_date'
  ])
})
test('Structural integrity of examiners files', t => {
  const { examiners } = t.context.files
  t.deepEqual(getHeader(examiners), [
    'section_id',
    'user_id',
    'role_id',
    'status'
  ])
})
test('Structural integrity of sections files', t => {
  const { sections } = t.context.files
  t.deepEqual(getHeader(sections), [
    'course_id',
    'section_id',
    'name',
    'status'
  ])
})
test('Structural integrity of students files', t => {
  const { students } = t.context.files
  t.deepEqual(getHeader(students), [
    'section_id',
    'user_id',
    'role_id',
    'status',
    'limit_section_privileges'
  ])
})
