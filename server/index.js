const express = require('express')
const app = express()
const prefix = process.env.PROXY_PATH || ''
const cron = require('../cron')

app.get(prefix + '/_monitor', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send('APPLICATION_STATUS: OK')
})

app.get(prefix + '/_monitor_all', (req, res) => {
  res.send(
    [
      '<html><body><pre>',
      'APPLICATION_STATUS: OK',
      '- Next invocation will be (local time in your computer):',
      `  <script>document.write(new Date(${cron.nextSync().getTime()}))</script>`,
      cron.isRunning ? '- Sync is running now' : '',
      '',
      'Environment:',
      `- CANVAS_API_URL: ${process.env.CANVAS_API_URL}`,
      `- AKTIVITETSTILLFALLEN_API_URL: ${process.env.AKTIVITETSTILLFALLEN_API_URL}`,
      `- KOPPS_API_URL: ${process.env.KOPPS_API_URL}`
    ].join('\n') + '\n'
  )
})

app.get(prefix + '/_about', (req, res) => {
  res.send('Hello antagna')
})

module.exports = app
