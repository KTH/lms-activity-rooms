/**
 * Singleton object, wrapping `@kth/canvas-api`. Exposes specific functions for this app.
 */
const log = require("skog");
const CanvasApi = require("@kth/canvas-api");
const fs = require("fs").promises;
const { createWriteStream } = require("fs");
const path = require("path");
const JSZip = require("jszip");

const canvasApi = CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_TOKEN
);

async function test() {
  try {
    await canvasApi.get("/accounts/1");
    return true;
  } catch (err) {
    log.error(err, "Error when trying to get /accounts/1");
    return false;
  }
}

/**
 * Send a set of files compressed as a single zip file to Canvas as SIS Import.
 *
 * Returns a Promise that is resolved only when the SIS Import is finished
 */
async function sendDirectory(dir) {
  try {
    const zip = new JSZip();
    const zipFile = path.join(dir, "lms-activity-rooms.zip");
    const files = await fs.readdir(dir);

    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      zip.file(file, await fs.readFile(path.resolve(dir, file)));
    }

    await new Promise((resolve, reject) => {
      zip
        .generateNodeStream({ type: "nodebuffer", streamFiles: true })
        .pipe(createWriteStream(zipFile))
        .on("finish", () => {
          log.info(`Finished generating zip file "${zipFile}"`);
          resolve();
        })
        .on("error", (err) => reject(err));
    });

    log.debug(`SIS IMPORT: File [${zipFile}] ready to be sent to Canvas`);

    const { body: response } = await canvasApi.sendSis(
      "/accounts/1/sis_imports",
      zipFile
    );
    const url = `${process.env.CANVAS_API_URL}/accounts/1/sis_imports/${response.id}`;
    log.info(
      `SIS IMPORT: correctly created with ID [${response.id}]. Details: ${url}`
    );
  } catch (err) {
    log.error(err);
  }
}

module.exports = {
  sendDirectory,
  test,
};
