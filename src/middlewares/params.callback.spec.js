import chai from 'chai'
import sinon from 'sinon'
import mocksHttp from 'node-mocks-http'
import ApplicationService from '../services/application.service'
import ApplicationUserService from '../services/application-user.service'
import ApplicationBillingService from '../services/application-billing.service'
import ApplicationRedirectService from '../services/application-redirect.service'
import * as paramsCallback from './params.callback'

const assert = chai.assert
const expect = chai.expect

describe('./middlewares/params.callback', () => {
  let res

  const plans = [
    { id: 'personal', name: 'Personal', price: 0 },
    { id: 'extreme', name: 'Extreme', price: 99 }
  ]

  describe('getApplicationId', () => {
    let stubApplicationUserIsAuthorized

    before(() => {
      let stubApplicationGet = sinon.stub(ApplicationService.prototype, 'get')
      stubApplicationGet.resolves({ id: 'app-id' })

      stubApplicationUserIsAuthorized = sinon.stub(ApplicationUserService.prototype, 'isAuthorized')
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

    it('success', (done) => {
      const req = mocksHttp.createRequest({
        user: { _id: '1' },
        params: { applicationId: '2' }
      })

      stubApplicationUserIsAuthorized.resolves(true)

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
        params: { applicationId: '3' }
      })

      stubApplicationUserIsAuthorized.rejects({ name: 'NAME', message: 'message' })

      paramsCallback.getApplicationId(req, res, (err) => {
        try {
          assert.equal(err.name, 'NAME')
          assert.equal(err.message, 'message')
          done()
        } catch (err) {
          done(err)
        }
      })
    })
  })

  describe('getPlanId', () => {
    before(() => {
      let stubApplicationBillingGetPlans = sinon.stub(ApplicationBillingService.prototype, 'getPlans')
      stubApplicationBillingGetPlans.resolves(plans)
    })

    after(() => {
      ApplicationBillingService.prototype.getPlans.restore()
    })

    it('success', (done) => {
      const req = mocksHttp.createRequest({
        params: { planId: 'personal' }
      })

      paramsCallback.getPlanId(req, res, () => {
        try {
          expect(req.applicationPlans).to.be.an('array')
          expect(req.applicationPlans).to.be.equal(plans)
          assert.equal(req.plan.id, 'personal')
          assert.equal(req.plan.name, 'Personal')
          assert.equal(req.plan.price, 0)
          done()
        } catch (err) {
          done(err)
        }
      })
    })

    it('should return error', (done) => {
      const req = mocksHttp.createRequest({
        params: { planId: 'unlimited' }
      })

      paramsCallback.getPlanId(req, res, (err) => {
        try {
          assert.equal(err.name, 'PlanNotFound')
          assert.equal(err.message, 'Plan does not exist.')
          done()
        } catch (err) {
          done(err)
        }
      })
    })
  })

  describe('getRedirectId', () => {
    let stubApplicationRedirectGet

    before(() => {
      stubApplicationRedirectGet = sinon.stub(ApplicationRedirectService.prototype, 'get')
    })

    after(() => {
      ApplicationRedirectService.prototype.get.restore()
    })

    it('success', (done) => {
      const req = mocksHttp.createRequest({
        params: {
          applicationId: 'app-id',
          redirectId: 'redirect-id'
        }
      })

      stubApplicationRedirectGet.resolves({ id: 'this-redirect-id' })
      paramsCallback.getRedirectId(req, res, () => {
        try {
          assert.equal(req.redirect.id, 'this-redirect-id')
          done()
        } catch (err) {
          done(err)
        }
      })
    })

    it('should return error', (done) => {
      const req = mocksHttp.createRequest({
        params: {
          applicationId: 'app-id',
          redirectId: 'error-redirect-id'
        }
      })

      stubApplicationRedirectGet.rejects({ name: 'NAME', message: 'message' })
      paramsCallback.getRedirectId(req, res, (err) => {
        try {
          assert.equal(err.name, 'NAME')
          assert.equal(err.message, 'message')
          done()
        } catch (err) {
          done(err)
        }
      })
    })
  })
})
