import chai from 'chai'
import mocksHttp from 'node-mocks-http'
import * as authCallback from './auth.callback'

const assert = chai.assert
const expect = chai.expect

describe('./middlewares/auth.callback', () => {
  let res

  beforeEach(() => {
    res = mocksHttp.createResponse({
      eventEmitter: require('events').EventEmitter
    })
  })

  describe('parseAuthorization', () => {
    it('should return an empty authorization header', (done) => {
      const req = mocksHttp.createRequest()
      authCallback.parseAuthorization(req, res, () => {
        expect(req.headers).to.be.an('object')
        assert.equal(req.headers.authorization, undefined)
        done()
      })
    })

    it('should return an authorization header and req.jwtToken', (done) => {
      const req = mocksHttp.createRequest({
        headers: { 'Authorization': 'Bearer JWTTOKEN' }
      })
      authCallback.parseAuthorization(req, res, () => {
        expect(req.headers).to.be.an('object')
        assert.equal(req.headers.authorization, 'Bearer JWTTOKEN')
        assert.equal(req.jwtToken, 'JWTTOKEN')
        done()
      })
    })
  })

  describe('parseUserId', () => {
    it('no user id to parse', (done) => {
      const req = mocksHttp.createRequest()
      authCallback.parseUserId(req, res, () => {
        assert.equal(req.user, undefined)
        done()
      })
    })

    it('getting user id 1', (done) => {
      const req = mocksHttp.createRequest({
        user: {
          sub: 'source|id'
        }
      })
      authCallback.parseUserId(req, res, () => {
        expect(req.user).to.be.an('object')
        assert.equal(req.user.sub, 'source|id')
        assert.equal(req.user._id, 'id')
        done()
      })
    })

    it('getting user id 2', (done) => {
      const req = mocksHttp.createRequest({
        user: {
          sub: 'id'
        }
      })
      authCallback.parseUserId(req, res, () => {
        expect(req.user).to.be.an('object')
        assert.equal(req.user.sub, 'id')
        assert.equal(req.user._id, 'id')
        done()
      })
    })
  })
})
