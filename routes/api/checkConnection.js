const express = require('express')
const { MongoClient } = require('mongodb')
const mysql = require('mysql')
const mssql = require('mssql')

const router = express.Router()

const mongo_database = 'retaildb_mongodb'
const host = 'localhost'

let mongoConfig = `mongodb://${host}:27017/${mongo_database}`

let mysqlConfig = {
  host: host,
  user: 'root',
  password: '',
  database: 'retaildb_mysql'
}

let mssqlConfig = {
  user: 'admin',
  password: 'admin',
  // server: 'DAVID-LAPTOP\\SQLEXPRESS01',
  server: 'PH-B8M91Z2\\SQLEXPRESS',
  database: 'retaildb_mssql',
  port: 1433,
  options: {
    enableArithAbort: false
  }
}

router.get('/mongo', async (req, res) => {
  let result = await checkMongoDBConnection()
  res.send(await result)
})

router.get('/mysql', async (req, res) => {
  let result = await checkMySQLConnection()
  res.send(result)
})

router.get('/mssql', async (req, res) => {
  let result = await checkMSSQLConnection()
  res.send(result)
})

// MongoDB Connect
// async function checkMongoDBConnection() {
//   let client = null

//   try {
//     client = await mongodb.MongoClient.connect(mongoConfig, {
//       useNewUrlParser: true
//     })
//   } catch (err) {
//     console.log(err)
//   } finally {
//     return !!client && !!client.topology && client.topology.isConnected()
//   }
// }

async function checkMongoDBConnection() {
  return new Promise ( (resolve, reject) => {
    let client = MongoClient(mongoConfig, { useNewUrlParser: true })
    let result = {
      status: false
    }
    try {
      client.connect((err) => {
        if(err) {
          result.error = {
            message: err.message
          }
          result.status = false
          resolve(result)
        } else {
          result.success = {
            message: 'Connected successfully.'
          }
          result.status = true
          resolve(result)
        }
      })
    } catch (err) {
      result.error = {
        message: err.message
      }
      result.status = false
      reject(result)
    } finally {
      client.close()
    }
  })
}

// MySQL Connect
async function checkMySQLConnection() {
  return new Promise (async (resolve, reject) => {
    let connection = mysql.createConnection(mysqlConfig)
    let result = {
      status: false
    }
    try {
      connection.connect((err) => {
        if(err) {
          result.error = {
            code: err.code,
            message: err.message
          }
          result.status = false
          resolve(result)
        } else {
          result.success = {
            message: 'Connected successfully.',
            connection_id: connection.threadId
          }
          result.status = true
          resolve(result)
        }
      })
    } catch (err) {
      result.error = {
        code: err.code,
        message: err.message
      }
      result.status = false
      reject(result)
    } finally {
      if( connection && connection.end ) connection.end()
      return result.status;
    }
  })
}

// MSSQL Connect
async function checkMSSQLConnection() {
  return new Promise (async (resolve, reject) => {
    let pool = new mssql.ConnectionPool(mssqlConfig)
    let result = {
      status: false
    }
    try {
      pool.connect( (err) => {
        if(err) {
          result.error = {
            code: err.code,
            message: err.message
          }
          result.status = false
          resolve(result)
        } else {
          result.success = {
            message: 'Connected successfully.'
          }
          result.status = true
          resolve(result)
        }
        
      })
    } catch (err) {
      result.error = {
        code: err.code,
        message: err.message
      }
      result.status = false
      reject(result)
    } finally {
      // if( pool && pool.close ) pool.close()
      return result.status
    }
  })
}

module.exports = router