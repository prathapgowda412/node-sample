const boom = require('boom')
const config = require('config')
const express = require('express')
const request = require('superagent')
const Twitter = require('twitter')
const { find, get } = require('lodash')

const router = express.Router()
const twitter = new Twitter({
  consumer_key: config.get('twitter.consumerKey'),
  consumer_secret: config.get('twitter.consumerSecret'),
  access_token_key: config.get('twitter.accessTokenKey'),
  access_token_secret: config.get('twitter.accessTokenSecret')
})
const yahooURI = config.get('yahoo.queryURI')

/**
 * Fetches woeid (where on earth ID) from Yahoo
 * @param  {String} place location to search for a woeid
 * @return {Promise}
 */
function getWoeid(place) {
  return request
    .get(yahooURI)
    .query({
      q: `select woeid from geo.places where text="${place}" limit 1`,
      diagnostics: 'false',
      format: 'json'
    })
}

/**
 * Fetches trend data from Twitter based on woeid
 * @param  {String} woeid where on earth ID
 * @return {Promise}
 */
function getPlaceTrends(woeid) {
  return twitter.get('trends/place', { id: woeid })
}

/**
 * Control flow callback for GET /trends/:place
 * @param  {Request} req
 * @param  {Response} res
 * @return {Object}
 */
function getTrends(req, res) {
  const { place } = req.params

  getWoeid(place)
    .then((woeidResponse) => {
      const woeid = get(woeidResponse.body, 'query.results.place.woeid', 'not found')

      if (woeid === 'not found') {
        const response = boom.notFound(`${place} could not be found`)
        res.status(404).send(response.output.payload)
        return
      }

      getPlaceTrends(woeid)
        .then((placeTrendsResponse) => {
          res.send(placeTrendsResponse)
        })
        .catch((error) => {
          const errorPayload = find(error, 'code')
          if (errorPayload.code === 34) {
            const response = boom.notFound(`Trends for ${place} could not be found`)
            res.status(404).send(response.output.payload)
          } else {
            // User will not see this custom message
            const response = boom.badImplementation(`Internal Twitter API error: ${errorPayload.message}`)
            res.status(500).send(response.output.payload)
          }
        })
    })
    .catch((error) => {
      // User will not see this custom message
      const response = boom.badImplementation('Internal Yahoo WOEID error', error)
      res.status(500).send(response.output.payload)
    })
}

// GET /trends/:place
router.get('/trends/:place', getTrends)

module.exports = router
