import chai from 'chai'
import chaiHttp from 'chai-http'
import httpMocks from 'node-mocks-http'
import rewire from 'rewire'
import app from '../test/index'
import config from '../config'
import jwt from 'jsonwebtoken'

// const app = new App()
const auth = rewire('./auth')

const assert = chai.assert
const expect = chai.expect

const res = httpMocks.createResponse()

chai.use(chaiHttp)

describe('./middlewares/auth', () => {

  // before((done) => {
  //   app.initialize()
  //   done()
  // })

  describe('parseAuthorization', () => {
    let req; let headers; let nextCalled
    const next = () => { nextCalled = true }
    const parseAuthorization = auth.__get__('parseAuthorization')

    beforeEach((done) => {
      nextCalled = false
      done()
    })

    it('should return an empty authorization header', (done) => {
      req = httpMocks.createRequest()
      parseAuthorization(req, res, next)
      headers = req['headers']
      expect(headers).to.be.an('object')
      assert.equal(headers.authorization, undefined)
      assert.equal(nextCalled, true)
      done()
    })

    it('should return an authorization header and req.jwtToken', (done) => {
      req = httpMocks.createRequest({
        headers: { 'Authorization': 'Bearer JWTTOKEN' }
      })
      parseAuthorization(req, res, next)
      headers = req['headers']
      expect(headers).to.be.an('object')
      assert.equal(headers.authorization, 'Bearer JWTTOKEN')
      assert.equal(req.jwtToken, 'JWTTOKEN')
      assert.equal(nextCalled, true)

      done()
    })
  })

  describe('jwtToken validation', () => {
    it('should access without jwtToken. GET /', (done) => {
      chai.request(app)
        .get('/')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          done()
        })
    })

    it('should fail, token was expected. GET /v1/testToken', (done) => {
      chai.request(app)
        .get('/v1/testToken')
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(401)
          expect(res).to.be.json
          done()
        })
    })

    it('should success, valid token but invalid endpoint. GET /v1/testToken', (done) => {
      const token = jwt.sign({ foo: 'bar' }, config.jwtSecret)
      chai.request(app)
        .get('/v1/testToken')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(404)
          done()
        })
    })

    it('should fail, invalid secret. GET /v1/testToken', (done) => {
      const token = jwt.sign({ foo: 'bar' }, 'invalid secret')
      chai.request(app)
        .get('/v1/testToken')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(401)
          done()
        })
    })
  })
})
