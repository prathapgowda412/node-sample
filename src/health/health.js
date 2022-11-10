const express = require('express')

const router = express.Router()

/**
 * Control flow callback for GET /health
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
function getHealth(req, res) {
  res.status(200).send({
    status: 'healthy'
  })
}

// GET /health
router.get('/health', getHealth)

module.exports = router
