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
async function writeActivities (activities, prefix) {

}

/**
 * Sends activities data to Canvas
 */
async function sendActivities (activities) {
  // TODO
}

module.exports = {
  writeActivities,
  sendActivities
}
