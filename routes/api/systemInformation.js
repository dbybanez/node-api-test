const express = require('express')
const router = express.Router()
const loadtest = require('loadtest');
const os = require('os');

router.get('/info', async (req, res) => {
  let result = await initSystemInfo()
  res.send(await result)
})

async function initSystemInfo() {
  return new Promise((resolve, reject) => {
    let value = {
      os: {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        totalmem: os.totalmem() / 1024 / 1024,
        freemem: os.freemem() / 1024 / 1024,
        cpus: os.cpus()
      }
    }
    resolve(value)
  })
}

module.exports = router