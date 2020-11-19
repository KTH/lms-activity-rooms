const { syncActivities } = require('../lib')
const log = require('skog')
const cuid = require('cuid')

function sleep (t) {
  return new Promise(resolve => {
    setTimeout(resolve, t)
  })
}

// Number of milliseconds between runs
const INTERVAL = 60 * 60 * 1000
let running = false

// How many times has the sync failed consecutively
let consecutiveFailures = 0

async function sync () {
  if (running) {
    return
  }

  running = true

  const numberOfDays = 60
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + numberOfDays)

  await log.child({ req_id: cuid() }, async () => {
    log.info(`Starting sync for period ${startDate} to ${endDate}`)
    try {
      await syncActivities(startDate, endDate)
      consecutiveFailures = 0
    } catch (err) {
      log.error('An error occured in the sync', err)
      consecutiveFailures++

      if (consecutiveFailures > 5) {
        log.fatal(err, 'Sync has failed more than 5 times in a row.')
        consecutiveFailures = 0
      }
    }
  })
  running = false
}

async function start () {
  while (true) {
    await sync()
    log.info(`Next invocation: ${new Date(Date.now() + INTERVAL)}`)
    await sleep(INTERVAL)
  }
}

function isRunning () {
  return running
}

module.exports = {
  start,
  isRunning
}
