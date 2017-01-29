import chai from 'chai'
import chaiHttp from 'chai-http'
import chaiJsonSchema from 'chai-json-schema'
import stripe from 'stripe'
import * as auth0 from 'auth0'

// import httpMocks from 'node-mocks-http'
// import rewire from 'rewire'
import app from '../index'
import config from '../config'
import jwt from 'jsonwebtoken'

// const user = rewire('./user')

// const assert = chai.assert
const expect = chai.expect

// const res = httpMocks.createResponse()

chai.use(chaiHttp)
chai.use(chaiJsonSchema)

describe('./v1/user', () => {
  let validContent = {
    'email': 'udlei@nati.biz',
    'email_verified': true,
    'iss': 'https://keepat.eu.auth0.com/',
    'sub': 'auth0|588930ba74e3aa709a591788',
    'aud': 'n1K6ZPkvgD7eLuKLXCBOy8d3dfnKlTAc',
    'iat': Math.floor(Date.now() / 1000) - 30,
    'exp': Math.floor(Date.now() / 1000) - 30 + 3600
  }
  let invalidUserContent = Object.assign({}, validContent)
  invalidUserContent.sub = 'auth0|588930ba74e3aa709a591777'

  const validToken = jwt.sign(validContent, config.jwtSecret)
  const invalidUserToken = jwt.sign(invalidUserContent, config.jwtSecret)
  const authManage = new auth0.ManagementClient({
    domain: config.auth0Domain,
    token: config.auth0Token
  })

  before((done) => {
    authManage.users.updateAppMetadata({
      id: validContent.sub
    }, null).then((userInfo) => {
      done()
    })
  })

  describe('/profile', () => {
    const profileSchema = {
      title: 'profile',
      type: 'object',
      required: ['id', 'email', 'email_verified'],
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        email_verified: { type: 'boolean' },
        stripe: {
          type: 'object',
          properties: {
            customer_id: { type: 'string' },
            subscription_id: { type: 'string' },
            plan_id: { type: 'string' },
            card: {
              type: 'object',
              properties: {
                last4: { type: 'string', minLength: 4, maxLength: 4 },
                brand: { type: 'string' },
                exp_month: { type: 'number', minimum: 1, maximum: 12 },
                exp_year: { type: 'number', minimum: 2016, maximum: 2050 }
              }
            }
          }
        }
      }
    }

    it('should fail, as expected', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(401)
          expect(res).to.be.json
          done()
        })
    })

    it('should return user profile', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .set('Authorization', 'Bearer ' + validToken)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema)
          expect(res.body.stripe.plan_id).to.be.equal('freemium')
          done()
        })
    })

    it('should fail, invalid user', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .set('Authorization', 'Bearer ' + invalidUserToken)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('User not found.')
          done()
        })
    })
  })

  describe('/creditCard', () => {
    const stripeClient = stripe(config.stripeSecretKey)
    const creditCardSchema = {
      title: 'creditCard',
      type: 'object',
      required: ['last4', 'brand', 'exp_month', 'exp_year'],
      properties: {
        last4: { type: 'string', minLength: 4, maxLength: 4 },
        brand: { type: 'string' },
        exp_month: { type: 'number', minimum: 1, maximum: 12 },
        exp_year: { type: 'number', minimum: 2016, maximum: 2050 }
      }
    }

    let validCreditCardToken; let invalidCreditCardToken

    before((done) => {
      let content = {
        card: {
          'number': '4242424242424242',
          'exp_month': 12,
          'exp_year': 2020,
          'cvc': '123'
        }
      }

      stripeClient.tokens.create(content, (err, validToken) => {
        if (err) return false
        validCreditCardToken = validToken.id
      }).then(() => {
        content.card.number = '4000000000000002'
        stripeClient.tokens.create(content, (err, invalidToken) => {
          if (err) return false
          invalidCreditCardToken = invalidToken.id
          done()
        })
      })
    })

    it('should return a valid credit card update', (done) => {
      chai.request(app)
        .put('/v1/user/creditCard')
        .set('Authorization', 'Bearer ' + validToken)
        .send({ token: validCreditCardToken })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(creditCardSchema)
          done()
        })
    })

    it('should fail, invalid credit card', (done) => {
      chai.request(app)
        .put('/v1/user/creditCard')
        .set('Authorization', 'Bearer ' + validToken)
        .send({ token: invalidCreditCardToken })
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('Your card was declined.')
          done()
        })
    })
  })

  describe('/plan', () => {
    const planSchema = {
      title: 'plan',
      type: 'object',
      required: [
        'current_period_start', 'current_period_end', 'trial_start', 'trial_end',
        'status'
      ],
      properties: {
        current_period_start: { type: 'number' },
        current_period_end: { type: 'number' },
        trial_start: { type: 'number' },
        trial_end: { type: 'number' },
        status: { type: 'string' },
        plan: {
          type: 'object',
          required: [ 'id', 'name' ],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          }
        }
      }
    }

    it('should change plan with success', (done) => {
      chai.request(app)
        .put('/v1/user/plan')
        .set('Authorization', 'Bearer ' + validToken)
        .send({ plan_id: 'basic' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(planSchema)
          expect(res.body.plan.id).to.be.equal('basic')
          done()
        })
    })

    it('should fail, plan already selected', (done) => {
      chai.request(app)
        .put('/v1/user/plan')
        .set('Authorization', 'Bearer ' + validToken)
        .send({ plan_id: 'basic' })
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('The selected plan is the same as the current plan.')
          done()
        })
    })

    it('should fail, invalid plan', (done) => {
      chai.request(app)
        .put('/v1/user/plan')
        .set('Authorization', 'Bearer ' + validToken)
        .send({ plan_id: 'invalidPlan' })
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(500)
          expect(res).to.be.json
          expect(res.body.message).to.be.equal('No such plan: invalidPlan')
          done()
        })
    })
  })
})
