const express = require('express')
const router = express.Router()
const loadtest = require('loadtest');
const os = require('os');

router.get('/run', async (req, res) => {
  let result = await initLoadTest()
  res.send(await result)
})

let results_statusCallback = []
let mysql_requests = []
let mssql_requests = []
let mongo_requests = []

async function initLoadTest() {
  return new Promise((resolve, reject) => {

    /**
     * Loadtest API configurations
     */
    const configs = [
      {
        db: "MySQL",
        option: {
          url: 'http://localhost:5000/api/load/mysql',
          concurrency: 10,
          maxSeconds: 20,
          statusCallback: statusCallback
        }
      },
      {
        db: "MSSQL",
        option: {
          url: 'http://localhost:5000/api/load/mssql',
          concurrency: 10,
          maxSeconds: 20,
          statusCallback: statusCallback
        }
      },
      {
        db: "MongoDB",
        option: {
          url: 'http://localhost:5000/api/load/mongo',
          concurrency: 10,
          maxSeconds: 20,
          statusCallback: statusCallback
        }
      }
    ]
  
    let promises = []
    
    /**
     * Loop through each configurations
     */
    configs.forEach((config, index) => {
      promises.push(runLoadTest(config))
    })

    Promise.all(promises).then((result) => {    
      // Map instances to their corresponding databases
      results_statusCallback.forEach((request) => {
        // Using modulo because instanceIndex increments all the time. No control
        if((request.instanceIndex % 3) === 0) { // MySQL
          mysql_requests.push(request)
        } else if((request.instanceIndex % 3) === 1) { // MSSQL
          mssql_requests.push(request)
        } else if((request.instanceIndex % 3) === 2){ // MongoDB
          mongo_requests.push(request)
        }
      })

      // // Sort MySQL requests by request index
      // mysql_requests.sort((a, b) => {
      //   if ( a.requestIndex < b.requestIndex ){
      //     return -1;
      //   }
      //   if ( a.requestIndex > b.requestIndex ){
      //     return 1;
      //   }
      //   return 0;
      // })
      // // Sort MSSQL requests by request index
      // mssql_requests.sort((a, b) => {
      //   if ( a.requestIndex < b.requestIndex ){
      //     return -1;
      //   }
      //   if ( a.requestIndex > b.requestIndex ){
      //     return 1;
      //   }
      //   return 0;
      // })
      // // Sort MongoDB requests by request index
      // mongo_requests.sort((a, b) => {
      //   if ( a.requestIndex < b.requestIndex ){
      //     return -1;
      //   }
      //   if ( a.requestIndex > b.requestIndex ){
      //     return 1;
      //   }
      //   return 0;
      // })

      let mysqlFilteredRequests = filterRequests(mysql_requests)
      // console.log(`20 Requests for MySQL: ${mysqlFilteredRequests.length}`)

      let mssqlFilteredRequests = filterRequests(mssql_requests)
      // console.log(`20 Requests for MSSQL: ${mssqlFilteredRequests.length}`)

      let mongoFilteredRequests = filterRequests(mongo_requests)
      // console.log(`20 Requests for MongoDB: ${mongoFilteredRequests.length}`)

      let results = {
        result: result,
        requests: {
          MySQL: mysql_requests,
          MSSQL: mssql_requests,
          MongoDB: mongo_requests
        }
      }

      results_statusCallback = []
      mysql_requests = []
      mssql_requests = []
      mongo_requests = []

      resolve(results)
    })
    
  })
}

/**
 * 
 * @param {Object} config - configurations set by configs variable
 */
async function runLoadTest (config) {
  return new Promise((resolve, reject) => {
    /**
     * Run loadtest API 
     * Refer to: https://www.npmjs.com/package/loadtest
     */
    loadtest.loadTest(config.option, function (error, result ) {
      if(error) throw error

      /**
       * rrs: Resident Set Size (mb)
       * heapTotal: Total Size of the Heap (mb)
       * heapUsed: Heap Used (mb)
       * 
       * Refer to: https://stackoverflow.com/questions/20018588/how-to-monitor-the-memory-usage-of-node-js
       * 
       */
      let value = {
        databaseName: config.db,
        results: result,
        memoryUsage: {
          rrs: process.memoryUsage().rss / 1024 / 1024,
          heapTotal: process.memoryUsage().heapTotal / 1024 / 1024,
          heapUsed: process.memoryUsage().heapUsed / 1024 / 1024
        }
      }
      resolve(value)
    })
  })
}

/**
 * Filters requests so that we don't have to display all 1000++ requests
 * @param {Object} requests - sorted requests from the results_statusCallback results
 */
function filterRequests(requests) {
  let value = []
  let i = Math.floor(requests[0].latency.totalTimeSeconds)
  let done = false

  /**
   * Go through each requests and get only the first values of the totalTimeSeconds.
   * 0.123, 0.234, 0.566, 1.123, 1.442, 1.562, 2.234, 2.561, 2.731
   * 0 = 0.123;
   * 1 = 1.123;
   * 2 = 2.234
   * 0 in this case represents time. 0 sec, 1 sec, 2 secs, 3 secs, etc.
   */
  requests.forEach((item, index) => {
    /**
     * The limit of 25 here is for the number of requests you want to get. which in this case is 25.
     * But since the we specified 20 in the load test API, we only get 19-21 requests. 
     */
    if(Math.floor(item.latency.totalTimeSeconds) === i && i < 23 && done === false) {
      done = true
      i+=1
      value.push(item)
    } else {
      done = false
    }
  })

  return value
}

/**
 * Refer to: https://www.npmjs.com/package/loadtest
 * 
 * Called from the loadtest function
 * 
 * @param {Object} error - Error object when the load test returns an error
 * @param {Object} result - The result of the load test
 * @param {Object} latency - The latency of the load test
 * 
 * Returns all requests
 */
function statusCallback(error, result, latency) {
  let value = {
    requestIndex: result.requestIndex,
    requestElapsed: result.requestElapsed,
    instanceIndex: result.instanceIndex,
    latency: {
      totalRequests: latency.totalRequests,
      totalTimeSeconds: latency.totalTimeSeconds,
      requestPerSecond: latency.rps,
      meanLatencyMs: latency.meanLatencyMs,
    },
    errors: error
  }
  results_statusCallback.push(value)
  // console.log('Current latency %j, result %j, error %j', latency, result, error);
  // console.log('----');
  // console.log('Request elapsed milliseconds: ', result.requestElapsed);
  // console.log('Request index: ', result.requestIndex);
  // console.log('Request loadtest() instance index: ', result.instanceIndex);
}

module.exports = router