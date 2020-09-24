const express = require('express')
const mssql = require('mssql')

const router = express.Router()

// Load Tables
router.get('/tables', async (req, res) => {
  const result = await loadDB()
  res.send(await result)
})

// MSSQL Connect
async function loadDB() {
  const config = {
    user: 'admin',
    password: 'admin',
    server: 'DAVID-LAPTOP\\SQLEXPRESS01',
    database: 'retaildb_mssql',
    port: 1433,
    options: {
      enableArithAbort: false
    }
  }

  let pool = null

  try {
    pool = await mssql.connect(config)
    console.log('Connection successful')

    let tablelist = await listTables(pool)
    console.log("Tables:")
    tablelist.forEach(function (elem, index) {
      console.log(` - ${elem.TABLE_NAME}`)
    })
    
    let employeelist = await getEmployeeList(pool)
    console.log("Employee List:")
    console.log(employeelist)

    employeelist.forEach(function (elem, index) {
      console.log(elem.EmployeeID + " | " + elem.FirstName + " | " + elem.LastName)
    })


  } catch (e) {
    console.error(e)
  } finally {
    pool.close()
    return tablelist
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