// TODO: should this file remain? Or should we delete it?
require('dotenv').config()
const log = require('skog')
const { writeActivities, syncActivities } = require('../lib')

async function start () {
  log.info('Hello world')
  const startDate = new Date(`${process.env.START_DATE}T00:00:00Z`)
  const endDate = new Date(`${process.env.END_DATE}T23:59:59Z`)
  await writeActivities(startDate, endDate, '/tmp/activities/')
}

async function start2 () {
  log.info('Hello world')
  const startDate = new Date(`${process.env.START_DATE}T00:00:00Z`)
  const endDate = new Date(`${process.env.END_DATE}T23:59:59Z`)
  await syncActivities(startDate, endDate)
}

start2()
