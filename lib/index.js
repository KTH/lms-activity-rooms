const log = require('skog')
const got = require('got')

/** Get examinators from Kopps */
async function getExaminators (courseCode) {
  // TODO
}

/** Get the activities of a day from AKT_API */
async function getActivities (date) {
  log.debug(`Date ${date}. Getting activities...`)

  const { body } = await got(
    `${process.env.AKTIVITETSTILLFALLEN_API_URL}/aktivitetstillfallen/students?fromDate=${date}&toDate=${date}`,
    {
      responseType: 'json',
      headers: {
        canvas_api_token: process.env.AKTIVITETSTILLFALLEN_API_TOKEN
      }
    }
  )

  log.info(
    `Date ${date}. Obtained ${body.aktivitetstillfallen.length} activities`
  )

  return body.aktivitetstillfallen
}

async function writeCourses (activities, file) {}

async function writeSections (activities, file) {}

async function writeExaminers (activities, file) {}

async function writeStudents (activities, file) {}

/**
 * Writes activities data into a set of files (courses, sections, examiners
 * and students)
 */
async function writeActivities (start, end, dir) {
  // TODO: test that this loop works for strange date ranges
  // e.g. when time changes, etc.
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = date.toISOString().split('T')[0]
    const activities = await getActivities(dateString)
  }
}

/**
 * Sends activities data to Canvas
 */
async function sendActivities (activities) {
  // TODO
}

/** Sends all activities of a certain period of time to Canvas */
async function syncActivities (start, end) {}

module.exports = {
  writeActivities,
  sendActivities,
  syncActivities
}
