const request = require('supertest')(require('../app'))
const { expect } = require('chai')
const { describe, it } = require('mocha')

describe('[integration] GET /health', () => {
  it('succeeds (200)', () => {
    return request
      .get('/health')
      .expect(200)
      .then((res) => {
        expect(res).to.not.have.deep.property('headers.x-powered-by')
        expect(res.body).to.have.property('status', 'healthy')
      })
  })
})
