require('dotenv').config()
const log = require('skog')
const { writeActivities, syncActivities } = require('../lib')

async function start () {
  log.info('Hello world')
  const startDate = new Date('2020-09-07T23:15:30')
  const endDate = new Date('2020-09-07T23:15:30')

  await writeActivities(startDate, endDate, '/tmp/activities/')
}

async function start2 () {
  log.info('Hello world')
  const startDate = new Date('August 10, 2020 23:15:30')
  const endDate = new Date('August 10, 2020 23:15:30')

  await syncActivities(startDate, endDate)
}

start()
