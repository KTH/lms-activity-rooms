require('dotenv').config()
const log = require('skog')
const { syncActivities } = require('../lib')

async function start () {
  log.info('Hello world')
  const startDate = new Date('2020-10-01T00:00:00Z')
  const endDate = new Date('2020-10-08T23:59:59Z')
  await syncActivities(startDate, endDate)
}

start()
