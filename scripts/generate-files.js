require('dotenv').config()
const log = require('skog')
const { writeActivities } = require('../lib')

async function start () {
  log.info('Hello world')
  const startDate = new Date(`${process.env.START_DATE}T00:00:00Z`)
  const endDate = new Date(`${process.env.END_DATE}T23:59:59Z`)
  await writeActivities(startDate, endDate, '/tmp/activities/')
}

start()
