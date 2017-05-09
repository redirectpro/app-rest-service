import chai from 'chai'
import chaiHttp from 'chai-http'
import jwt from 'jsonwebtoken'
import config from '../config'
import app from '../test/app'

const expect = chai.expect

chai.use(chaiHttp)

describe('./middlewares/auth', () => {
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
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(401)
          done()
        })
    })
  })
})
