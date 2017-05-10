import Promise from 'es6-promise'
import chai from 'chai'
import chaiHttp from 'chai-http'
import sinon from 'sinon'
import mocksHttp from 'node-mocks-http'
import StripeService from '../../services/stripe.service'
import ApplicationService from '../../services/application.service'
import ApplicationBillingService from '../../services/application-billing.service'
import eventsCallback from './events.callback'

const assert = chai.assert
const expect = chai.expect

chai.use(chaiHttp)

describe('./stripe/events.callback', () => {
  let res

  beforeEach(() => {
    res = mocksHttp.createResponse({
      eventEmitter: require('events').EventEmitter
    })
  })

  describe('validateStripeEvent', () => {
    let stubStripeServiceRetrieveEvent

    before(() => {
      stubStripeServiceRetrieveEvent = sinon.stub(StripeService.prototype, 'retrieveEvent')
    })

    after(() => {
      StripeService.prototype.retrieveEvent.restore()
    })

    it('success', (done) => {
      const req = mocksHttp.createRequest({
        body: {
          id: 'event-id',
          object: 'event'
        }
      })

      stubStripeServiceRetrieveEvent.resolves({
        id: 'event-id'
      })

      eventsCallback.validateStripeEvent(req, res, () => {
        try {
          expect(req.stripeEvent).to.be.an('object')
          assert.equal(req.stripeEvent.id, 'event-id')
          done()
        } catch (err) {
          done(err)
        }
      })
    })

    it('Should return no such event', (done) => {
      const req = mocksHttp.createRequest({
        body: {
          id: 'event-id',
          object: 'event'
        }
      })

      stubStripeServiceRetrieveEvent.rejects({
        name: 'NAME',
        message: 'message'
      })

      eventsCallback.validateStripeEvent(req, res, (err) => {
        try {
          assert.equal(err.statusCode, 404)
          assert.equal(err.name, 'NAME')
          assert.equal(err.message, 'message')
          done()
        } catch (err) {
          done(err)
        }
      })
    })

    it('Should return invalid event', (done) => {
      const req = mocksHttp.createRequest({})

      eventsCallback.validateStripeEvent(req, res, (err) => {
        try {
          assert.equal(err.name, 'InvalidEvent')
          assert.equal(err.message, 'Invalid event.')
          done()
        } catch (err) {
          done(err)
        }
      })
    })
  })

  describe('postEvent', () => {
    let stubApplicationServiceGet

    before(() => {
      stubApplicationServiceGet = sinon.stub(ApplicationService.prototype, 'get')
      sinon.stub(ApplicationBillingService.prototype, 'createSubscription').callsFake((params) => {
        return new Promise((resolve) => {
          resolve({
            planId: params.planId
          })
        })
      })
    })

    after(() => {
      ApplicationService.prototype.get.restore()
      ApplicationBillingService.prototype.createSubscription.restore()
    })

    it('success', (done) => {
      const req = mocksHttp.createRequest({
        stripeEvent: {
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'event-id',
              customer: 'app-id',
              current_period_start: 2
            }
          }
        }
      })

      stubApplicationServiceGet.resolves({
        subscription: {
          id: 'other-event-id',
          current_period_start: 1,
          plan: {
            upcomingPlanId: 'new-plan'
          }
        }
      })

      res.on('end', () => {
        try {
          assert.equal(res.statusCode, 200)
          assert.equal(res._getData().planId, 'new-plan')
          done()
        } catch (err) {
          done(err)
        }
      })

      eventsCallback.postEvent(req, res)
    })

    it('should return subscription already processed', (done) => {
      const req = mocksHttp.createRequest({
        stripeEvent: {
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'event-id',
              customer: 'app-id',
              current_period_start: 1
            }
          }
        }
      })

      stubApplicationServiceGet.resolves({
        subscription: {
          id: 'other-event-id',
          current_period_start: 2
        }
      })

      res.on('end', () => {
        try {
          assert.equal(res.statusCode, 200)
          assert.equal(res._getData().message, 'Subscription already processed.')
          done()
        } catch (err) {
          done(err)
        }
      })

      eventsCallback.postEvent(req, res)
    })

    it('Should return error 1', (done) => {
      const req = mocksHttp.createRequest({
        stripeEvent: {
          type: 'customer.subscription.deleted',
          data: {
            object: {
              customer: 'app-id'
            }
          }
        }
      })

      stubApplicationServiceGet.rejects({
        name: 'ApplicationNotFound',
        message: 'application-not-found'
      })

      res.on('end', () => {
        try {
          assert.equal(res.statusCode, 200)
          assert.equal(res._getData(), 'application-not-found')
          done()
        } catch (err) {
          done(err)
        }
      })

      eventsCallback.postEvent(req, res)
    })

    it('Should return error 2', (done) => {
      const req = mocksHttp.createRequest({
        stripeEvent: {
          type: 'customer.subscription.deleted',
          data: {
            object: {
              customer: 'app-id'
            }
          }
        }
      })

      stubApplicationServiceGet.rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          assert.equal(res.statusCode, 500)
          assert.equal(res._getData().name, 'NAME')
          assert.equal(res._getData().message, 'message')
          done()
        } catch (err) {
          done(err)
        }
      })

      eventsCallback.postEvent(req, res)
    })

    it('Should ignore event', (done) => {
      const req = mocksHttp.createRequest({
        stripeEvent: {
          type: 'invalid.event'
        }
      })

      res.on('end', () => {
        try {
          assert.equal(res.statusCode, 200)
          assert.equal(res._getData().message, 'Event invalid.event has been ignored.')
          done()
        } catch (err) {
          done(err)
        }
      })

      eventsCallback.postEvent(req, res)
    })
  })
})
