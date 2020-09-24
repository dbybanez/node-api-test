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
  res.send(await result)
})

router.get('/mssql', async (req, res) => {
  let result = await checkMSSQLConnection()
  res.send(result)
})

async function checkMongoDBConnection() {
  return new Promise ((resolve, reject) => {
    let client = MongoClient(mongoConfig, { useNewUrlParser: true })
    let result = {
      status: false
    }

    let collections = []

    try {
      client.connect( async (err) => {
        if(err) {
          result.error = {
            message: err.message
          }
          result.status = false
          resolve(result)
        } else {
          // Get all collections
          let queryResult = await client.db(mongo_database).listCollections().toArray()
          
          // Loop all results and add it to collections
          queryResult.forEach(child => {
            collections.push(child.name)
          })

          let promises = []

          // Loop all collections and load every promise to promises[]
          collections.forEach((collection, index) => {
            promises.push(retrieveAllCollectionData(collection, client))
          })

          // Promise all loops and resolve result
          Promise.all(promises).then((result) => {
            client.close()
            resolve(result)
          })
        }
      })
    } catch (err) {
      result.error = {
        message: err.message
      }
      result.status = false
      reject(result)
    } finally {
      // client.close()
    }
  })
}

async function retrieveAllCollectionData (collection, client) {
  return new Promise(async (resolve, reject) => {
    let result = await client.db(mongo_database).collection(collection).find({}).toArray()
    let value = {
      collectionName: collection,
      collectionData: result
    }
    resolve(value)
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
          let promises = []

          connection.query("SHOW TABLES", function (error, results, fields) {
            if(error) throw error
            // console.log(results)
            if(results.length > 0) {
              for (result in results) {
                let table = JSON.parse(JSON.stringify(results[result])).Tables_in_retaildb_mysql
                promises.push(retrieveAllTableDataMySQL(table, connection))
                // console.log(retrieveAllTableDataMySQL(table, connection))
              }
              Promise.all(promises).then((result) => {
                if( connection && connection.end ) connection.end()
                resolve(result)
              })
            }
          })
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
      // if( connection && connection.end ) connection.end()
      // return result.status;
    }
  })
}

async function retrieveAllTableDataMySQL (table, connection) {
  return new Promise(async (resolve, reject) => {
    let result
    let query = `SELECT * FROM ${table}`
    let query_result = []
    await connection.query(query, function (error, results, fields) {
      if(error) throw error
      if(results.length > 0) {
        for (result in results) {
          query_result.push(results[result])
        }
      }
      let res = JSON.parse(JSON.stringify(query_result))
      let value = {
        tableName: table,
        tableData: res
      }
      resolve(value)
    })
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
          let promises = []
          // console.log('hey')
          pool.query("SELECT Distinct TABLE_NAME FROM INFORMATION_SCHEMA.TABLES", function (error, results, fields) {
            if(error) throw error
            if(results.recordset.length > 0) {
              for(result in results.recordset) {
                let table = JSON.parse(JSON.stringify(results.recordset[result].TABLE_NAME))
                promises.push(retrieveAllTableDataMSSQL(table, pool))
              }
              Promise.all(promises).then((result) => {
                if( pool && pool.close ) pool.close()
                resolve(result)
              })
            }
          })
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
      // return result.status
    }
  })
}

async function retrieveAllTableDataMSSQL (table, pool) {
  return new Promise(async (resolve, reject) => {
    let result
    let query = `SELECT * FROM ${table}`
    let query_result = []
    await pool.query(query, function (error, results, fields) {
      if(error) throw error

      // check memory usage for every table query
      // console.log(`Heap Used (mb): ${process.memoryUsage().heapUsed / 1024 / 1024}`)
      
      if(results.recordset.length > 0) {
        for (result in results.recordset) {
          query_result.push(results.recordset[result])
        }
      }
      let res = JSON.parse(JSON.stringify(query_result))
      let value = {
        tableName: table,
        tableData: res
      }
      resolve(value)
    })
  })
}

module.exports = router