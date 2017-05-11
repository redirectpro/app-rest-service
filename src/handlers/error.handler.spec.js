import ErrorHandler from './error.handler'
import chai from 'chai'
import mocksHttp from 'node-mocks-http'

const assert = chai.assert
const expect = chai.expect

describe('./handlers/error.handler', () => {
  describe('responseError', () => {
    let res; let req

    beforeEach(() => {
      req = mocksHttp.createRequest()
      res = mocksHttp.createResponse({
        eventEmitter: require('events').EventEmitter
      })
    })

    it('should return message AnyMessage and status 500', (done) => {
      let err = {
        name: 'AnyError',
        message: 'AnyMessage'
      }

      res.on('end', () => {
        assert.equal(res.statusCode, 500)

        let data = res._getData()
        expect(data).to.be.an('object')
        assert.equal(data.message, 'AnyMessage')

        done()
      })

      ErrorHandler.responseError(err, req, res)
    })

    it('should return message UnauthorizedMessage and status 401', (done) => {
      let err = {
        name: 'UnauthorizedError',
        message: 'UnauthorizedMessage'
      }

      ErrorHandler.responseError(err, req, res, () => {
        assert.equal(res.statusCode, 401)

        let data = res._getData()
        expect(data).to.be.an('object')
        assert.equal(data.message, 'UnauthorizedMessage')

        done()
      })
    })
  })

  describe('makeSureErrorIsNull', () => {
    it('should transform error', (done) => {
      let err = ErrorHandler.makeSureErrorIsNull(null, 'NotFound')
      expect(err).to.be.an('object')
      assert.equal(err.name, 'UserNotFound')
      assert.equal(err.message, 'User not found.')
      done()
    })
  })

  describe('typeError', () => {
    it('should return CustomError', (done) => {
      let err = ErrorHandler.typeError('NAME', 'message')
      assert.equal(err.name, 'NAME')
      assert.equal(err.message, 'message')
      done()
    })
  })
})
