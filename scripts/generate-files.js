require('dotenv').config()
const log = require('skog')
const { writeActivities } = require('../lib')

async function start () {
  log.info('Hello world')
  const startDate = new Date('August 1, 2020 23:15:30')
  const endDate = new Date('August 30, 2020 23:15:30')

  await writeActivities(startDate, endDate, '/tmp/activities/')
}

start()
