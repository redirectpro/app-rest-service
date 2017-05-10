import Promise from 'es6-promise'
import chai from 'chai'
import sinon from 'sinon'
import config from '../config'
import StripeService from './stripe.service'
import DynDBService from '../services/dyndb.service'
import ApplicationBillingService from './application-billing.service'

const assert = chai.assert
const expect = chai.expect

describe('./services/application-billing.service', () => {
  const applicationBillingService = new ApplicationBillingService()

  before(() => {
    const stubDynDBServiceUpdate = sinon.stub(DynDBService.prototype, 'update')
    stubDynDBServiceUpdate.callsFake((params) => {
      return new Promise((resolve) => {
        return resolve(params.item)
      })
    })
  })

  after(() => {
    DynDBService.prototype.update.restore()
  })

  describe('getPlans', () => {
    it('return all plans', (done) => {
      applicationBillingService.getPlans().then((plans) => {
        expect(plans).to.be.an('array')
        expect(plans).to.be.equal(config.plans)
        done()
      }).catch((err) => done(err))
    })
  })

  describe('updateCreditCard', () => {
    const card = {
      brand: 'visa',
      last4: '4242',
      exp_month: '12',
      exp_year: '2020'
    }

    let stubStripeServiceUpdateCreditCard

    before(() => {
      stubStripeServiceUpdateCreditCard = sinon.stub(StripeService.prototype, 'updateCreditCard')

      const stubStripeServiceRetrieveToken = sinon.stub(StripeService.prototype, 'retrieveToken')
      stubStripeServiceRetrieveToken.resolves({ card: card })
    })

    after(() => {
      StripeService.prototype.updateCreditCard.restore()
      StripeService.prototype.retrieveToken.restore()
    })

    it('success', (done) => {
      stubStripeServiceUpdateCreditCard.resolves()

      applicationBillingService.updateCreditCard({
        applicationId: 'app-id',
        token: '123'
      }).then((item) => {
        expect(item).to.be.an('object')
        expect(item).to.be.equal(item)
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeServiceUpdateCreditCard.rejects({
        name: 'NAME', message: 'message'
      })

      applicationBillingService.updateCreditCard({
        applicationId: 'invalid-id',
        token: 'invalid-token'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('createToken', () => {
    let stubStripeServiceCreateToken

    before(() => {
      stubStripeServiceCreateToken = sinon.stub(StripeService.prototype, 'createToken')
    })

    after(() => {
      StripeService.prototype.createToken.restore()
    })

    it('success', (done) => {
      stubStripeServiceCreateToken.resolves(true)

      applicationBillingService.createToken({
        param1: 'param1-value'
      }).then((r) => {
        expect(r).to.be.true
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeServiceCreateToken.rejects({
        name: 'NAME', message: 'message'
      })

      applicationBillingService.createToken({
        param1: 'param1-value'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('subscriptionResponseHandler', () => {
    it('success', (done) => {
      const subscription = {
        id: 1,
        current_period_start: 2,
        current_period_end: 3,
        trial_start: 4,
        trial_end: 5,
        plan: {
          id: 6,
          interval: 7,
          upcomingPlanId: 8
        }
      }
      const result = applicationBillingService.subscriptionResponseHandler(subscription)
      expect(result).to.be.deep.equal(subscription)
      done()
    })
  })

  describe('deleteSubscription', () => {
    let stubStripeServiceDelSubscription

    before(() => {
      stubStripeServiceDelSubscription = sinon.stub(StripeService.prototype, 'delSubscription')
    })

    after(() => {
      StripeService.prototype.delSubscription.restore()
    })

    it('success with at_period_end = true', (done) => {
      stubStripeServiceDelSubscription.resolves({ plan: { } })
      applicationBillingService.deleteSubscription({
        id: '1',
        at_period_end: true,
        upcomingPlanId: 'unlimited'
      }).then((item) => {
        assert.equal(item.plan.upcomingPlanId, 'unlimited')
        done()
      }).catch(err => done(err))
    })

    it('success with at_period_end = false', (done) => {
      stubStripeServiceDelSubscription.resolves({ plan: { } })
      applicationBillingService.deleteSubscription({
        id: '2',
        at_period_end: false,
        upcomingPlanId: 'unlimited'
      }).then((item) => {
        assert.equal(item.plan.upcomingPlanId, null)
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeServiceDelSubscription.rejects({
        name: 'NAME', message: 'message'
      })

      applicationBillingService.deleteSubscription({
        param1: 'param1-value'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('updateSubscription', () => {
    let stubStripeServiceUpdateSubscription

    before(() => {
      stubStripeServiceUpdateSubscription = sinon.stub(StripeService.prototype, 'updateSubscription')
    })

    after(() => {
      StripeService.prototype.updateSubscription.restore()
    })

    it('success', (done) => {
      stubStripeServiceUpdateSubscription.resolves({
        plan: { id: 'personal' }
      })

      applicationBillingService.updateSubscription({
        id: '1',
        planId: 'personal'
      }).then((item) => {
        expect(item).to.be.an('object')
        expect(item.plan).to.be.an('object')
        assert.equal(item.plan.id, 'personal')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeServiceUpdateSubscription.rejects({
        name: 'NAME', message: 'message'
      })

      applicationBillingService.updateSubscription({
        param1: 'param1-value'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('createSubscription', () => {
    let stubStripeServiceCreateSubscription

    before(() => {
      stubStripeServiceCreateSubscription = sinon.stub(StripeService.prototype, 'createSubscription')
    })

    after(() => {
      StripeService.prototype.createSubscription.restore()
    })

    it('success', (done) => {
      stubStripeServiceCreateSubscription.resolves({ plan: {} })

      applicationBillingService.createSubscription({
        applicationId: 'app-id',
        planId: 'personal'
      }).then((item) => {
        expect(item).to.be.an('object')
        expect(item.plan).to.be.an('object')
        assert.equal(item.plan.id, null)
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeServiceCreateSubscription.rejects({
        name: 'NAME', message: 'message'
      })

      applicationBillingService.createSubscription({
        param1: 'param1-value'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('upcomingSubscriptionCost', () => {
    let stubStripeServiceGet

    before(() => {
      stubStripeServiceGet = sinon.stub(StripeService.prototype, 'get')

      sinon.stub(StripeService.prototype, 'retrieveUpcomingInvoices').resolves({
        lines: {
          data: [
            {
              amount: 999,
              period: {
                start: 1221039614,
                end: 1252575614
              }
            },
            {
              amount: 1999,
              period: {
                start: 1400000000,
                end: 1999999999
              }
            },
            {
              amount: 9999,
              period: {
                start: 1322039614,
                end: 1362575614
              }
            }
          ]
        }
      })

      sinon.stub(Date, 'now').returns(1400000000000)
    })

    after(() => {
      StripeService.prototype.get.restore()
      StripeService.prototype.retrieveUpcomingInvoices.restore()
      Date.now.restore()
    })

    it('success', (done) => {
      stubStripeServiceGet.resolves({
        subscriptions: {
          data: [
            { id: 'subscription-id' }
          ]
        }
      })

      applicationBillingService.upcomingSubscriptionCost({
        applicationId: 'app-id',
        planId: 'unlimited'
      }).then((item) => {
        expect(item).to.be.a('number')
        assert.equal(item, 19.99)
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeServiceGet.rejects({
        name: 'NAME', message: 'message'
      })

      applicationBillingService.upcomingSubscriptionCost({
        param1: 'param1-value'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })
})
