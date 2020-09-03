const { scheduleJob } = require('node-schedule')
const { syncActivities } = require('../lib')
const log = require('skog')
const cuid = require('cuid')

// "0 5 * * *" = "Every day at 5:00"
const INTERVAL = process.env.INTERVAL || '0 5 * * *'

// "0,30 * * * *" = "Every 30 minutes (at X:00 and X:30)"
const FAILURE_INTERVAL = '0,30 * * * *'

const START_DATE = new Date(process.env.START_DATE)
const END_DATE = new Date(process.env.END_DATE)

if (!START_DATE) {
  log.fatal(`Wrong value for env variable START_DATE: ${START_DATE}`)
  process.exit()
}

if (!END_DATE) {
  log.fatal(`Wrong value for env variable START_DATE: ${END_DATE}`)
  process.exit()
}

let job
let running = false

// How many times has the sync failed consecutively
let consecutiveFailures = 0

async function sync () {
  if (running) {
    return
  }

  running = true

  await log.child({ req_id: cuid() }, async () => {
    log.info(
      `Starting sync for period ${process.env.START_DATE} to ${process.env.END_DATE}`
    )
    try {
      await syncActivities(START_DATE, END_DATE)
      consecutiveFailures = 0
    } catch (err) {
      consecutiveFailures++

      if (consecutiveFailures > 5) {
        log.fatal(err, 'Sync has failed more than 5 times in a row.')
        consecutiveFailures = 0
        job.reschedule(INTERVAL)
      } else {
        job.reschedule(FAILURE_INTERVAL)
        log.error(
          err,
          `Error in sync for ${START_DATE}-${END_DATE}. It has failed ${consecutiveFailures} times in a row. Will try again on: ${job.nextInvocation()}`
        )
      }
    }
  })
  running = false
}

async function start () {
  job = scheduleJob(INTERVAL, async () => {
    await sync()
    log.info(`Next sync is scheduled for: ${job.nextInvocation()}`)
  })
  await sync()
  log.info(`Next sync is scheduled for: ${job.nextInvocation()}`)
}

function nextSync () {
  if (job) {
    return job.nextInvocation()
  } else {
    return 'synchronization not set'
  }
}

function isRunning () {
  return running
}

module.exports = {
  start,
  nextSync,
  isRunning
}
