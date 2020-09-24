const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

// Middleware
// app.use(bodyParser.json()) // or use app.use(express.json())
app.use(cors())

//Body parser
app.use(express.json())
app.use(express.urlencoded({ extended:false }))

const posts = require('./api/posts')

app.use('/api/posts', posts)

// Handle production
if(process.env.NODE_ENV === 'production') {
  // Static folder
  app.use(express.static(__dirname + '/public/'))

  // Hande SPA (single page application)
  app.get(/.*/, (req, res) => res.sendFile(__dirname + '/public/index.html'))
}

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`Server started on port ${port}`))