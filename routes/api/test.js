const express = require('express')
const mongodb = require('mongodb')
const mysql = require('mysql')

const router = express.Router()

// Load Tables
router.get('/tables', async (req, res) => {
  const result = await loadDB()
  res.send(await result)
})

// Get Collections
router.get('/collections', async (req, res) => {
  const collections = await loadCollections()
  console.log(collections)
  res.send(await collections.listCollections().toArray())
})

// MongoDB Connect
async function loadCollections() {
  const client = await mongodb.MongoClient.connect('mongodb://localhost:27017/vue_express', {
    useNewUrlParser: true
  })

  return client.db('retaildb_mongodb')
}

// MySQL Connect
async function loadDB() {
  let connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'retaildb_mysql'
  })

  let result = null

  try {
    connection.connect()
    //tablelist = await listTables(connection)
    // tablelist.forEach(function(elem, index){
    //   console.log(` - ${elem.Tables_in_retaildb_mysql}`)
    // })
    result = await getEmployeeList(connection)
  } catch (err) {
    return err
  } finally {
    if( connection && connection.end ) connection.end()
    return result;
  }
}

async function listTables(connection) {
  return new Promise ( (resolve, reject) => {
    var result
    var query_result = []
    var res
    let query = "SHOW TABLES"
    connection.query(query, function (error, results, fields) {
      if (error) throw error
      if(results.length > 0) {
        for (result in results) {
          query_result.push(results[result])
        }
      }
      res = JSON.parse(JSON.stringify(query_result))
      resolve(res)
    })
  })
}

async function getEmployeeList( connection ) {
  return new Promise((resolve, reject)  => {
    var result
    var query_result = []
    var res
    var query = "SELECT * FROM employeelist"
    connection.query(query, function (error, results, fields) {
      if (error) throw error
      if(results.length > 0) {
        for (result in results) {
          query_result.push(results[result])
        }
      }
      res = JSON.parse(JSON.stringify(query_result))
      resolve(res)
    })
  })
}

module.exports = router