const skog = require('skog')

/** Get examinators from Kopps */
async function getExaminators (courseCode) {
  // TODO
}

/** Get the activities of a day from AKT_API */
async function getActivities (date) {
  // TODO
}

async function writeCourses (activities, file) {}

async function writeSections (activities, file) {}

async function writeExaminers (activities, file) {}

async function writeStudents (activities, file) {}

/**
 * Writes activities data into a set of files (courses, sections, examiners
 * and students)
 */
async function writeActivities (activities, prefix) {}

/**
 * Sends activities data to Canvas
 */
async function sendActivities (activities) {
  // TODO
}

/** Sends all activities of a certain period of time to Canvas */
async function syncActivities (start, end) {
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    skog.info(date)
  }
}

module.exports = {
  writeActivities,
  sendActivities,
  syncActivities
}
