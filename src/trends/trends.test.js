const config = require('config')
const nock = require('nock')
const request = require('supertest')(require('../app'))
const { expect } = require('chai')
const { describe, it } = require('mocha')

const yahooBaseURI = config.get('yahoo.queryBaseURI')

// Block outgoing HTTP requests
nock.disableNetConnect()

// Enable only localhost connections for integration tests
nock.enableNetConnect('127.0.0.1')

describe('[integration] GET /trends/:place trends for place found', () => {
  beforeEach(() => {
    nock(yahooBaseURI)
      .get('/v1/public/yql')
      .query(true) // Mock the matched URL regardless of query params
      .reply(200, {
        query: {
          count: 1,
          created: '2017-10-15T01:57:07Z',
          lang: 'en-US',
          results: { place: { woeid: '2391279' } }
        }
      })

    // Mock Twitter module's outbound HTTP call
    nock('https://api.twitter.com:443')
      .get('/1.1/trends/place.json')
      .query(true) // Mock the matched URL regardless of query params
      .reply(200, [{
        trends: [{
          name: '#CSURams',
          url: 'http://twitter.com/search?q=%23CSURams',
          promoted_content: null,
          query: '%23CSURams',
          tweet_volume: null
        }, {
          name: '#Reform17',
          url: 'http://twitter.com/search?q=%23Reform17',
          promoted_content: null,
          query: '%23Reform17',
          tweet_volume: null
        }],
        as_of: '2017-10-15T03:10:26Z',
        created_at: '2017-10-15T03:04:11Z',
        locations: [{
          name: 'Denver',
          woeid: 2391279
        }]
      }])
  })

  afterEach(() => { nock.cleanAll() })

  it('succeeds (200)', () => {
    return request
      .get('/trends/denver')
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('array')
        expect(res.body[0]).to.be.an('object')
        expect(res.body[0]).to.have.property('trends').that.is.an('array')
        expect(res.body[0]).to.have.property('as_of').that.is.a('string')
        expect(res.body[0]).to.have.property('created_at').that.is.a('string')
        expect(res.body[0]).to.have.property('locations').that.is.an('array')
        expect(res.body[0].locations[0]).to.have.property('woeid', 2391279)
      })
  })
})

describe('[integration] GET /trends/:place place not found', () => {
  beforeEach(() => {
    nock(yahooBaseURI)
      .get('/v1/public/yql')
      .query(true) // Mock the matched URL regardless of query params
      .reply(200, {
        query: {
          count: 1,
          created: '2017-10-15T01:57:07Z',
          lang: 'en-US',
          results: null
        }
      })
  })

  afterEach(() => { nock.cleanAll() })

  it('fails (404)', () => {
    return request
      .get('/trends/asdf')
      .expect(404)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('statusCode', 404)
        expect(res.body).to.have.property('error', 'Not Found')
        expect(res.body).to.have.property('message', 'asdf could not be found')
      })
  })
})

describe('[integration] GET /trends/:place trends for place not found', () => {
  beforeEach(() => {
    nock(yahooBaseURI)
      .get('/v1/public/yql')
      .query(true) // Mock the matched URL regardless of query params
      .reply(200, {
        query: {
          count: 1,
          created: '2017-10-15T01:57:07Z',
          lang: 'en-US',
          results: { place: { woeid: '2367231' } }
        }
      })

    // Mock Twitter module's outbound HTTP call
    nock('https://api.twitter.com:443')
      .get('/1.1/trends/place.json')
      .query(true) // Mock the matched URL regardless of query params
      .reply(404, {
        errors: [{
          code: 34,
          message: 'Sorry, that page does not exist.'
        }]
      })
  })

  afterEach(() => { nock.cleanAll() })

  it('fails (404)', () => {
    return request
      .get('/trends/boulder co')
      .expect(404)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('statusCode', 404)
        expect(res.body).to.have.property('error', 'Not Found')
        expect(res.body).to.have.property('message', 'Trends for boulder co could not be found')
      })
  })
})

describe('[integration] GET /trends/:place place internal error', () => {
  beforeEach(() => {
    nock(yahooBaseURI)
      .get('/v1/public/yql')
      .query(true) // Mock the matched URL regardless of query params
      .reply(500)
  })

  afterEach(() => { nock.cleanAll() })

  it('fails (500)', () => {
    return request
      .get('/trends/denver')
      .expect(500)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('statusCode', 500)
        expect(res.body).to.have.property('error', 'Internal Server Error')
        expect(res.body).to.have.property('message', 'An internal server error occurred')
      })
  })
})

describe('[integration] GET /trends/:place trends for place internal error', () => {
  beforeEach(() => {
    nock(yahooBaseURI)
      .get('/v1/public/yql')
      .query(true) // Mock the matched URL regardless of query params
      .reply(200, {
        query: {
          count: 1,
          created: '2017-10-15T01:57:07Z',
          lang: 'en-US',
          results: { place: { woeid: '2391279' } }
        }
      })

    // Mock Twitter module's outbound HTTP call
    nock('https://api.twitter.com:443')
      .get('/1.1/trends/place.json')
      .query(true) // Mock the matched URL regardless of query params
      .reply(500, {
        errors: [{
          code: 131,
          message: 'Internal error.'
        }]
      })
  })

  afterEach(() => { nock.cleanAll() })

  it('fails (500)', () => {
    return request
      .get('/trends/denver')
      .expect(500)
      .then((res) => {
        expect(res.body).to.be.an('object')
        expect(res.body).to.have.property('statusCode', 500)
        expect(res.body).to.have.property('error', 'Internal Server Error')
        expect(res.body).to.have.property('message', 'An internal server error occurred')
      })
  })
})
