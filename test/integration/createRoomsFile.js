require('dotenv').config()
const test = require('ava')
const nock = require('nock')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { writeActivities } = require('../../lib')

const mockFileName = path.resolve('test', 'integration', 'files', 'answer.json')
const mockData = fs.readFileSync(mockFileName, { encoding: 'utf-8' })

const dir = fs.promises.mkdtemp(path.join(os.tmpdir(), 'exams-'))
const start = new Date('August 1, 2020 23:15:30')
const end = new Date('August 15, 2020 23:15:30')

test.beforeEach(async () => {
  nock(`${process.env.AKTIVITETSTILLFALLEN_API_URL}/aktivitetstillfallen`)
    .get('/students')
    .query(true)
    .reply(200, JSON.parse(mockData))
    .persist()
  await writeActivities(start, end, await dir)
})

test(`Generating lms-activity-rooms.courses.csv ${start} - ${end}`, async t => {
  const fileName = path.resolve(await dir, 'lms-activity-rooms.courses.csv')
  const content = fs.readFileSync(fileName, { encoding: 'utf-8' })
  t.assert(content.length)
})
test(`Generating lms-activity-rooms.sections.csv ${start} - ${end}`, async t => {
  const fileName = path.resolve(await dir, 'lms-activity-rooms.sections.csv')
  const content = fs.readFileSync(fileName, { encoding: 'utf-8' })
  t.assert(content.length)
})
test(`Generating lms-activity-rooms.examiners.csv ${start} - ${end}`, async t => {
  const fileName = path.resolve(await dir, 'lms-activity-rooms.examiners.csv')
  const content = fs.readFileSync(fileName, { encoding: 'utf-8' })
  t.assert(content.length)
})
test(`lms-activity-rooms.students.csv is not empty`, async t => {
  const fileName = path.resolve(await dir, 'lms-activity-rooms.students.csv')
  const content = fs.readFileSync(fileName, { encoding: 'utf-8' })
  t.assert(content.length)
})
