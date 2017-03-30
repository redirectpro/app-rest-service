import chai from 'chai'
import chaiHttp from 'chai-http'
import chaiJsonSchema from 'chai-json-schema'
import app from '../../test/app'
import TestUtils from '../../test/utils'
import ApplicatinService from '../../services/application.service'
import config from '../../config'

const expect = chai.expect

chai.use(chaiHttp)
chai.use(chaiJsonSchema)

describe('./v1/billing', () => {
  const applicationService = new ApplicatinService()
  const userId = 'testBillingSpecId'
  const testUtils = new TestUtils()
  const accessToken = testUtils.genAccessToken({
    'email': `${userId}@redirectpro.io`,
    'sub': `auth0|${userId}`
  })

  const profileSchema = {
    type: 'object',
    required: ['email', 'subscription'],
    properties: {
      email: { type: 'string' },
      subscription: {
        type: 'object',
        required: [
          'current_period_start', 'current_period_end',
          'trial_start', 'trial_end',
          'plan'
        ],
        properties: {
          current_period_start: { type: 'number' },
          current_period_end: { type: 'number' },
          trial_start: { type: ['number', 'null'] },
          trial_end: { type: ['number', 'null'] },
          plan: {
            type: 'object',
            required: ['id', 'interval', 'upcoming'],
            properties: {
              id: { type: 'string' },
              interval: { type: 'string' },
              upcoming: { type: ['string', 'null'] }
            }
          }
        }
      },
      card: {
        type: 'object',
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

  let applicationId
  let cardTokens = {}

  before((done) => {
    applicationService.user.delete(userId, true).then(() => {
      done()
      // setTimeout(() => { done() }, 2000)
    }).catch((err) => {
      done(err)
    })
  })

  describe('../user/profile', () => {
    it('first access on /v1/user/profile to create application', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body.applications).to.be.instanceof(Array)
          applicationId = res.body.applications[0].id
          done()
        })
    })
  })

  describe('/:applicationId/profile', () => {
    it('should return billing profile', (done) => {
      chai.request(app)
        .get(`/v1/billing/${applicationId}/profile`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema)
          expect(res.body.subscription.plan.id).to.be.equal(config.defaultPlanId)
          expect(res.body.subscription.plan.interval).to.be.equal('month')
          expect(res.body.subscription.plan.upcoming).to.be.null
          done()
        })
    })
  })

  describe('/:applicationId/plan/:planId', () => {
    it('should return error because doesn\'t have creditCard', (done) => {
      const url = `/v1/billing/${applicationId}/plan/professional`
      chai.request(app)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('Please add a card to your account before choosing a plan.')
          done()
        })
    })
  })

  describe('/:applicationId/creditCard', () => {
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

    it('should return a valid credit card update, final 4242', (done) => {
      const url = `/v1/billing/${applicationId}/creditCard/${cardTokens.card1}`
      chai.request(app)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema.properties.card)
          expect(res.body.last4).to.be.equal('4242')
          done()
        })
    })

    it('should return a valid credit card update, final 4444', (done) => {
      const url = `/v1/billing/${applicationId}/creditCard/${cardTokens.card2}`
      chai.request(app)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema.properties.card)
          expect(res.body.last4).to.be.equal('4444')
          done()
        })
    })

    it('should fail, invalid credit card', (done) => {
      const url = `/v1/billing/${applicationId}/creditCard/${cardTokens.card3}`
      chai.request(app)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('Your card was declined.')
          done()
        })
    })

    it('should fail, invalid credit card token', (done) => {
      const url = `/v1/billing/${applicationId}/creditCard/invalid-token`
      chai.request(app)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('No such token: invalid-token')
          done()
        })
    })
  })

  describe('/plans', () => {
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

    it('should return all plans', (done) => {
      const url = `/v1/billing/plans`
      chai.request(app)
        .get(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(planSchema)
          done()
        })
    })
  })

  describe('/:applicationId/plan/:planId', () => {
    it('should change plan with success', (done) => {
      const url = `/v1/billing/${applicationId}/plan/professional`
      chai.request(app)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema.properties.subscription)
          expect(res.body.plan.id).to.be.equal('professional')
          done()
        })
    })

    it('should fail, plan already selected', (done) => {
      const url = `/v1/billing/${applicationId}/plan/professional`
      chai.request(app)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('The selected plan is the same as the current plan.')
          done()
        })
    })

    it('should fail, invalid plan', (done) => {
      const url = `/v1/billing/${applicationId}/plan/invalid-plan`
      chai.request(app)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('No such plan: invalid-plan')
          done()
        })
    })
  })
})
