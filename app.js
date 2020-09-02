require('dotenv').config()
require('skog/bunyan').createLogger({
  app: 'lms-activity-rooms',
  name: 'lms-activity-rooms',
  level:
    process.env.NODE_ENV === 'development'
      ? 'trace'
      : process.env.LOG_LEVEL || 'info',
  serializers: require('bunyan').stdSerializers
})

const log = require('skog')
process.on('uncaughtException', err => {
  log.fatal(err, 'Uncaught Exception thrown')
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  throw reason
})

// require('@kth/reqvars').check()
// const cron = require('./cron')
const server = require('./server')

log.child({ trigger: 'http' }, () => {
  server.listen(process.env.PORT || 3000, () => {
    log.info(`Express server started!`)
  })
})

/*
log.child({ trigger: 'cron' }, () => {
  cron.start()
})
*/
