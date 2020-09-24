const express = require('express')

const router = express.Router()

// Get Posts
router.get('/', async (req, res) => {
  // const posts = await loadPostsCollection()
  const data = {
    hello: "Bosski"
  }
  res.send(data)
})

module.exports = router