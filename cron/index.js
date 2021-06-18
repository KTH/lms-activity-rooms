const { syncActivities } = require('../lib')
const log = require('skog')
const cuid = require('cuid')

/**
 * Runs a `callback` (async function) and resolves with the value of that
 * `callback`. If `callback` takes too much to resolve, logs an
 * error message.
 *
 * Note: this function doesn't do anything with `callback`. Its execution will
 * continue after timeout until it resolves/rejects
 * @param callback - An async function
 * @param timeout - Time in milliseconds until an error is logged
 */
async function runWithTimeout (callback, ms) {
  const t = setTimeout(() => {
    log.error('Synchronization is taking too much… Maybe has hanged?')
  }, ms)

  const result = await callback()
  clearTimeout(t)
  return result
}

function sleep (t) {
  return new Promise(resolve => {
    setTimeout(resolve, t)
  })
}

// Number of milliseconds between runs
const INTERVAL = 60 * 60 * 1000

// Time to wait until we log an error message
const TIMEOUT = 24 * 60 * 60 * 1000

// How many times has the sync failed consecutively
let consecutiveFailures = 0

// When does the sync started the last time
let startTime = null

async function sync () {
  startTime = new Date()

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
}

async function start () {
  while (true) {
    await runWithTimeout(sync, TIMEOUT)
    log.info(`Next invocation: ${new Date(Date.now() + INTERVAL)}`)
    await sleep(INTERVAL)
  }
}

function getStartTime () {
  return startTime
}

module.exports = {
  start,
  getStartTime
}
