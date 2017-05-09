import chai from 'chai'
import sinon from 'sinon'
import mocksHttp from 'node-mocks-http'
import ApplicationService from '../services/application.service'
import ApplicationUserService from '../services/application-user.service'
import * as paramsCallback from './params.callback'

const assert = chai.assert
// const expect = chai.expect

describe('./middlewares/params.callback', () => {
  let res; let stubUser

  before(() => {
    let stubApplication = sinon.stub(ApplicationService.prototype, 'get')
    stubApplication.resolves({ id: 'app-id' })

    stubUser = sinon.stub(ApplicationUserService.prototype, 'isAuthorized')
  })

  after(() => {
    ApplicationService.prototype.get.restore()
    ApplicationUserService.prototype.isAuthorized.restore()
  })

  beforeEach(() => {
    res = mocksHttp.createResponse({
      eventEmitter: require('events').EventEmitter
    })
  })

  describe('getApplicationId', () => {
    it('success', (done) => {
      const req = mocksHttp.createRequest({
        user: { _id: '1' },
        params: { applicationId: '2' }
      })

      stubUser.resolves(true)

      paramsCallback.getApplicationId(req, res, () => {
        try {
          assert.equal(req.application.id, 'app-id')
          done()
        } catch (err) {
          done(err)
        }
      })
    })

    it('should return error', (done) => {
      const req = mocksHttp.createRequest({
        user: { _id: '1' },
        params: { applicationId: '2' }
      })

      stubUser.rejects({ code: 'CODE', message: 'message' })

      res.on('end', () => {
        try {
          assert.equal(res.statusCode, 500)
          assert.equal(res._getData().message, 'message')
          done()
        } catch (err) {
          done(err)
        }
      })

      paramsCallback.getApplicationId(req, res)
    })
  })
})
