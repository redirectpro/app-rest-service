// import Promise from 'es6-promise'
import chai from 'chai'
import mocksHttp from 'node-mocks-http'
import chaiJsonSchema from 'chai-json-schema'
import sinon from 'sinon'
import TestUtils from '../../test/utils'
import config from '../../config'
import ApplicationService from '../../services/application.service'
import ApplicationBillingService from '../../services/application-billing.service'
import billingCallback from './billing.callback'

const expect = chai.expect

chai.use(chaiJsonSchema)

describe('./routes/v1/billing.callback', () => {
  let res
  // let application
  let cardTokens = {}
  let defaultReqParams = {
    application: null,
    applicationPlans: config.plans,
    user: {
      _id: userId,
      email: userEmail
    }
  }

  const applicationService = new ApplicationService()
  const userId = 'testUserSpecId'
  const userEmail = `${userId}@redirectpro.io`
  const testUtils = new TestUtils()

  const profileSchema = {
    type: 'object',
    required: ['email', 'subscription'],
    properties: {
      email: { type: 'string' },
      subscription: {
        type: 'object',
        required: [
          'id',
          'current_period_start', 'current_period_end',
          'trial_start', 'trial_end',
          'plan'
        ],
        properties: {
          id: { type: 'string' },
          current_period_start: { type: 'number' },
          current_period_end: { type: 'number' },
          trial_start: { type: ['number', 'null'] },
          trial_end: { type: ['number', 'null'] },
          plan: {
            type: 'object',
            required: ['id', 'interval', 'upcomingPlanId'],
            properties: {
              id: { type: 'string' },
              interval: { type: 'string' },
              upcomingPlanId: { type: ['string', 'null'] }
            }
          }
        }
      },
      card: {
        type: ['object', 'null'],
        required: ['last4', 'brand', 'exp_month', 'exp_year'],
        properties: {
          last4: { type: 'string', minLength: 4, maxLength: 4 },
          brand: { type: 'string' },
          exp_month: { type: 'number', minimum: 1, maximum: 12 },
          exp_year: { type: 'number', minimum: 2016, maximum: 2050 }
        }
      }
    }
  }

  before((done) => {
    testUtils.resetUser({
      userId: userId,
      userEmail: userEmail
    }).then((_application) => {
      defaultReqParams.application = _application
      done()
    }).catch((err) => {
      done(err)
    })
  })

  beforeEach(() => {
    res = mocksHttp.createResponse({
      eventEmitter: require('events').EventEmitter
    })
  })

  describe('getPlans', () => {
    const planSchema = {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'price'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' }
        }
      }
    }

    it('success', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.an('array')
          expect(data).to.be.jsonSchema(planSchema)
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.getPlans(req, res)
    })

    it('should return error', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      sinon.stub(ApplicationBillingService.prototype, 'getPlans').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(data).to.be.an('object')
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationBillingService.prototype.getPlans.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.getPlans(req, res)
    })
  })

  describe('getProfile', () => {
    it('success', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          if (data.card === undefined) delete data.card
          expect(data).to.be.jsonSchema(profileSchema)
          expect(data.subscription.plan.id).to.be.equal(config.defaultPlanId)
          expect(data.subscription.plan.interval).to.be.equal('month')
          expect(data.subscription.plan.upcomingPlanId).to.be.null
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.getProfile(req, res)
    })
  })

  describe('putCreditCard', () => {
    before((done) => {
      let content = {
        card: {
          'exp_month': 12,
          'exp_year': 2020,
          'cvc': '123'
        }
      }

      // valid card
      content.card.number = '4242424242424242'
      const p1 = applicationService.billing.createToken(content)

      // valid card
      content.card.number = '5555555555554444'
      const p2 = applicationService.billing.createToken(content)

      // invalid card
      content.card.number = '4000000000000002'
      const p3 = applicationService.billing.createToken(content)

      Promise.all([p1, p2, p3]).then(([p1Result, p2Result, p3Result]) => {
        cardTokens.card1 = p1Result.id
        cardTokens.card2 = p2Result.id
        cardTokens.card3 = p3Result.id
        done()
      }).catch((err) => {
        done(err)
      })
    })

    after((done) => {
      testUtils.getApplication(defaultReqParams.application.id).then((_application) => {
        defaultReqParams.application = _application
        done()
      })
    })

    it('should return a valid credit card update, final 4242', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        params: {
          applicationId: defaultReqParams.application.id,
          token: cardTokens.card1
        }
      }))
      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(profileSchema.properties.card)
          expect(data.last4).to.be.equal('4242')
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putCreditCard(req, res)
    })

    it('should return a valid credit card update, final 4444', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        params: {
          applicationId: defaultReqParams.application.id,
          token: cardTokens.card2
        }
      }))

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(profileSchema.properties.card)
          expect(data.last4).to.be.equal('4444')
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putCreditCard(req, res)
    })

    it('should fail, invalid credit card', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        params: {
          applicationId: defaultReqParams.application.id,
          token: cardTokens.card3
        }
      }))

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(402)
          expect(data.message).to.be.equal('Your card was declined.')
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putCreditCard(req, res)
    })
  })

  describe('putPlan', () => {
    it('should return error because doesn\'t have creditCard', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: defaultReqParams.defaultPlanId
      }
      delete reqParams.application.card
      const req = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('Please add a card to your account before choosing a plan.')
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putPlan(req, res)
    })

    it('should upgrade the plan', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[2].id
      }
      const req = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(profileSchema.properties.subscription)
          expect(data.plan.id).to.be.equal(config.plans[2].id)

          testUtils.getApplication(defaultReqParams.application.id).then((_application) => {
            defaultReqParams.application = _application
            done()
          }).catch(err => done(err))
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putPlan(req, res)
    })

    it('should downgrade the plan', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[1].id
      }
      const req = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(profileSchema.properties.subscription)
          expect(data.plan.id).to.be.equal(config.plans[2].id)
          expect(data.plan.upcomingPlanId).to.be.equal(config.plans[1].id)

          testUtils.getApplication(defaultReqParams.application.id).then((_application) => {
            defaultReqParams.application = _application
            done()
          }).catch(err => done(err))
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putPlan(req, res)
    })

    it('should fail, plan already selected', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[2].id
      }
      const req = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('The selected plan is the same as the current plan.')
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putPlan(req, res)
    })

    it('should return generic error 1', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[1].id
      }
      const reqAlt = mocksHttp.createRequest(reqParams)

      sinon.stub(ApplicationBillingService.prototype, 'deleteSubscription').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationBillingService.prototype.deleteSubscription.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putPlan(reqAlt, res)
    })

    it('should return generic error 2', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[3].id
      }
      const req = mocksHttp.createRequest(reqParams)

      sinon.stub(ApplicationBillingService.prototype, 'updateSubscription').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationBillingService.prototype.updateSubscription.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.putPlan(req, res)
    })
  })

  describe('postCancelUpcomingPlan', () => {
    it('success', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id
      }
      const reqAlt = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data.plan.upcomingPlanId).to.be.null
          testUtils.getApplication(defaultReqParams.application.id).then((_application) => {
            defaultReqParams.application = _application
            done()
          }).catch(err => done(err))
        } catch (err) {
          done(err)
        }
      })

      billingCallback.postCancelUpcomingPlan(reqAlt, res)
    })

    it('should return NoUpcomingPlan', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id
      }
      const req = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('There is no upcoming plan setted.')
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.postCancelUpcomingPlan(req, res)
    })

    it('should return generic error', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id
      }
      reqParams.application.subscription.plan.upcomingPlanId = config.plans[0].id
      const req = mocksHttp.createRequest(reqParams)

      sinon.stub(ApplicationBillingService.prototype, 'updateSubscription').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationBillingService.prototype.updateSubscription.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.postCancelUpcomingPlan(req, res)
    })
  })

  describe('getPlanUpcoming', () => {
    it('upgrading plan', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[3].id
      }
      const req = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data.at_period_end).to.be.equal(false)
          const upcomingCost = Math.round(config.plans[3].price - config.plans[2].price)
          expect(data.plan.upcomingCost).to.be.equal(upcomingCost)
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.getPlanUpcoming(req, res)
    })

    it('downgrading plan', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[1].id
      }
      const req = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data.at_period_end).to.be.equal(true)
          expect(data.plan.price).to.be.equal(config.plans[1].price)
          expect(data.plan.upcomingCost).to.be.equal(0)
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.getPlanUpcoming(req, res)
    })

    it('should return SamePlan', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[2].id
      }
      const req = mocksHttp.createRequest(reqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('The selected plan is the same as the current plan.')
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.getPlanUpcoming(req, res)
    })

    it('should return generic error', (done) => {
      const reqParams = JSON.parse(JSON.stringify(defaultReqParams))
      reqParams.params = {
        applicationId: defaultReqParams.application.id,
        planId: config.plans[3].id
      }
      const req = mocksHttp.createRequest(reqParams)

      sinon.stub(ApplicationBillingService.prototype, 'upcomingSubscriptionCost').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationBillingService.prototype.upcomingSubscriptionCost.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      billingCallback.getPlanUpcoming(req, res)
    })
  })
})
