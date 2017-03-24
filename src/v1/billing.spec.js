import chai from 'chai'
import chaiHttp from 'chai-http'
import chaiJsonSchema from 'chai-json-schema'
import stripe from 'stripe'
import * as auth0 from 'auth0'

import app from '../index'
import config from '../config'
import jwt from 'jsonwebtoken'

const expect = chai.expect

chai.use(chaiHttp)
chai.use(chaiJsonSchema)

describe('./v1/billing', () => {
  it('xxx', (done) => {
    done()
  })
//   let validUserContent = {
//     'email': 'udlei@nati.biz',
//     'email_verified': true,
//     'iss': 'https://keepat.eu.auth0.com/',
//     'sub': 'auth0|588930ba74e3aa709a591788',
//     'aud': 'n1K6ZPkvgD7eLuKLXCBOy8d3dfnKlTAc',
//     'iat': Math.floor(Date.now() / 1000) - 30,
//     'exp': Math.floor(Date.now() / 1000) - 30 + 3600
//   }
//   let invalidUserContent = Object.assign({}, validUserContent)
//   invalidUserContent.sub = 'auth0|588930ba74e3aa709a591777'
//
//   const validUserToken = jwt.sign(validUserContent, config.jwtSecret)
//   const invalidUserToken = jwt.sign(invalidUserContent, config.jwtSecret)
//   const stripeClient = stripe(config.stripeSecretKey)
//   const authClient = new auth0.AuthenticationClient({
//     domain: config.auth0Domain
//   })
//   const authManage = new auth0.ManagementClient({
//     domain: config.auth0Domain,
//     token: config.auth0Token
//   })
//
//   const testInvalidUser = (method, endpoint, done) => {
//     let request = chai.request(app)
//
//     if (method === 'get') {
//       request = request.get(endpoint)
//     } else if (method === 'put') {
//       request = request.put(endpoint)
//     } else if (method === 'post') {
//       request = request.post(endpoint)
//     }
//
//     request
//       .set('Authorization', 'Bearer ' + invalidUserToken)
//       .end((err, res) => {
//         expect(err).to.be.not.null
//         expect(res).to.have.status(500)
//         expect(res).to.be.json
//         expect(res.body.message).to.be.equal('User not found.')
//         done()
//       })
//   }
//
//   // before((done) => {
//   //   authClient.tokens.getInfo(validUserToken, (err, userInfo) => {
//   //     if (err) return false
//   //
//   //     if (!userInfo.app_metadata ||
//   //       !userInfo.app_metadata.stripe ||
//   //       !userInfo.app_metadata.stripe.customer_id) {
//   //       done()
//   //     } else {
//   //       let customerId = userInfo.app_metadata.stripe.customer_id
//   //
//   //       stripeClient.customers.del(customerId, (err) => {
//   //         if (err && err.message === 'No such customer: ' + customerId) {
//   //           true
//   //         } else if (err) {
//   //           console.log(err)
//   //           return false
//   //         }
//   //
//   //         authManage.users.updateAppMetadata({
//   //           id: validUserContent.sub
//   //         }, null).then(() => {
//   //           done()
//   //         })
//   //       })
//   //     }
//   //   })
//   // })
//   //
  // describe('/profile', () => {
//     const profileSchema = {
//       title: 'profile',
//       type: 'object',
//       required: ['id', 'applications'],
//       properties: {
//         id: { type: 'string' },
//         applications: {
//           type: 'array',
//           properties: {
//             id: { type: 'string' }
//           }
//         }
//       }
//     }
//
//     it('should fail, as expected, no authentication sent', (done) => {
//       chai.request(app)
//         .get('/v1/user/profile')
//         .end((err, res) => {
//           expect(err).to.be.not.null
//           expect(res).to.have.status(401)
//           expect(res).to.be.json
//           done()
//         })
//     })
//
//     // it.only('should fail, invalid user', (done) => {
//     //   testInvalidUser('get', '/v1/user/profile', done)
//     // })
//
//     it('should return user profile - first access', (done) => {
//       chai.request(app)
//         .get('/v1/user/profile')
//         .set('Authorization', 'Bearer ' + validUserToken)
//         .end((err, res) => {
//           expect(err).to.be.null
//           expect(res).to.have.status(200)
//           expect(res).to.be.json
//           expect(res.body).to.be.jsonSchema(profileSchema)
//           // expect(res.body.stripe.plan_id).to.be.equal('personal')
//           done()
//         })
//     })
//
//     it('should return user profile - second access', (done) => {
//       chai.request(app)
//         .get('/v1/user/profile')
//         .set('Authorization', 'Bearer ' + validUserToken)
//         .end((err, res) => {
//           expect(err).to.be.null
//           expect(res).to.have.status(200)
//           expect(res).to.be.json
//           expect(res.body).to.be.jsonSchema(profileSchema)
//           // expect(res.body.stripe.plan_id).to.be.equal('personal')
//           done()
//         })
//     })
//   })
//
//   // describe('/creditCard', () => {
//   //   const creditCardSchema = {
//   //     title: 'creditCard',
//   //     type: 'object',
//   //     required: ['last4', 'brand', 'exp_month', 'exp_year'],
//   //     properties: {
//   //       last4: { type: 'string', minLength: 4, maxLength: 4 },
//   //       brand: { type: 'string' },
//   //       exp_month: { type: 'number', minimum: 1, maximum: 12 },
//   //       exp_year: { type: 'number', minimum: 2016, maximum: 2050 }
//   //     }
//   //   }
//   //
//   //   let validCreditCardToken; let invalidCreditCardToken
//   //
//   //   before((done) => {
//   //     let content = {
//   //       card: {
//   //         'number': '4242424242424242',
//   //         'exp_month': 12,
//   //         'exp_year': 2020,
//   //         'cvc': '123'
//   //       }
//   //     }
//   //
//   //     stripeClient.tokens.create(content, (err, validToken) => {
//   //       if (err) return false
//   //       validCreditCardToken = validToken.id
//   //     }).then(() => {
//   //       content.card.number = '4000000000000002'
//   //       stripeClient.tokens.create(content, (err, invalidToken) => {
//   //         if (err) return false
//   //         invalidCreditCardToken = invalidToken.id
//   //         done()
//   //       })
//   //     })
//   //   })
//   //
//   //   it('should fail, invalid user', (done) => {
//   //     testInvalidUser('put', '/v1/user/creditCard', done)
//   //   })
//   //
//   //   it('should return a valid credit card update', (done) => {
//   //     chai.request(app)
//   //       .put('/v1/user/creditCard')
//   //       .set('Authorization', 'Bearer ' + validUserToken)
//   //       .send({ token: validCreditCardToken })
//   //       .end((err, res) => {
//   //         expect(err).to.be.null
//   //         expect(res).to.have.status(200)
//   //         expect(res).to.be.json
//   //         expect(res.body).to.be.jsonSchema(creditCardSchema)
//   //         done()
//   //       })
//   //   })
//   //
//   //   it('should fail, invalid credit card', (done) => {
//   //     chai.request(app)
//   //       .put('/v1/user/creditCard')
//   //       .set('Authorization', 'Bearer ' + validUserToken)
//   //       .send({ token: invalidCreditCardToken })
//   //       .end((err, res) => {
//   //         expect(err).to.be.not.null
//   //         expect(res).to.have.status(500)
//   //         expect(res).to.be.json
//   //         expect(res.body.message).to.be.equal('Your card was declined.')
//   //         done()
//   //       })
//   //   })
//   //
//   //   it('should fail, invalid credit card token', (done) => {
//   //     chai.request(app)
//   //       .put('/v1/user/creditCard')
//   //       .set('Authorization', 'Bearer ' + validUserToken)
//   //       .send({ token: 'invalidToken' })
//   //       .end((err, res) => {
//   //         expect(err).to.be.not.null
//   //         expect(res).to.have.status(500)
//   //         expect(res).to.be.json
//   //         expect(res.body.message).to.be.equal('No such token: invalidToken')
//   //         done()
//   //       })
//   //   })
//   // })
//   //
//   // describe('/plan', () => {
//   //   const planSchema = {
//   //     title: 'plan',
//   //     type: 'object',
//   //     required: [
//   //       'current_period_start', 'current_period_end', 'trial_start', 'trial_end',
//   //       'status'
//   //     ],
//   //     properties: {
//   //       current_period_start: { type: 'number' },
//   //       current_period_end: { type: 'number' },
//   //       trial_start: { type: ['number', 'null'] },
//   //       trial_end: { type: ['number', 'null'] },
//   //       status: { type: 'string' },
//   //       plan: {
//   //         type: 'object',
//   //         required: [ 'id', 'name' ],
//   //         properties: {
//   //           id: { type: 'string' },
//   //           name: { type: 'string' }
//   //         }
//   //       }
//   //     }
//   //   }
//   //
//   //   it('should fail, invalid user', (done) => {
//   //     testInvalidUser('put', '/v1/user/plan', done)
//   //   })
//   //
//   //   it('should change plan with success', (done) => {
//   //     chai.request(app)
//   //       .put('/v1/user/plan')
//   //       .set('Authorization', 'Bearer ' + validUserToken)
//   //       .send({ plan_id: 'professional' })
//   //       .end((err, res) => {
//   //         expect(err).to.be.null
//   //         expect(res).to.have.status(200)
//   //         expect(res).to.be.json
//   //         expect(res.body).to.be.jsonSchema(planSchema)
//   //         expect(res.body.plan.id).to.be.equal('professional')
//   //         done()
//   //       })
//   //   })
//   //
//   //   it('should fail, plan already selected', (done) => {
//   //     chai.request(app)
//   //       .put('/v1/user/plan')
//   //       .set('Authorization', 'Bearer ' + validUserToken)
//   //       .send({ plan_id: 'professional' })
//   //       .end((err, res) => {
//   //         expect(err).to.be.not.null
//   //         expect(res).to.have.status(500)
//   //         expect(res).to.be.json
//   //         expect(res.body.message).to.be.equal('The selected plan is the same as the current plan.')
//   //         done()
//   //       })
//   //   })
//   //
//   //   it('should fail, invalid plan', (done) => {
//   //     chai.request(app)
//   //       .put('/v1/user/plan')
//   //       .set('Authorization', 'Bearer ' + validUserToken)
//   //       .send({ plan_id: 'invalidPlan' })
//   //       .end((err, res) => {
//   //         expect(err).to.be.not.null
//   //         expect(res).to.have.status(500)
//   //         expect(res).to.be.json
//   //         expect(res.body.message).to.be.equal('No such plan: invalidPlan')
//   //         done()
//   //       })
//   //   })
//   //
//   //   it('should fail, you must inform a plan', (done) => {
//   //     chai.request(app)
//   //       .put('/v1/user/plan')
//   //       .set('Authorization', 'Bearer ' + validUserToken)
//   //       .end((err, res) => {
//   //         expect(err).to.be.not.null
//   //         expect(res).to.have.status(500)
//   //         expect(res).to.be.json
//   //         expect(res.body.message).to.be.equal('You must inform a plan.')
//   //         done()
//   //       })
//   //   })
//   //
//   //   it('should fail, credit card undefined. Need to restore credit card after.', (done) => {
//   //     authClient.tokens.getInfo(validUserToken, (err, userInfo) => {
//   //       if (err) return false
//   //       let stripe = userInfo.app_metadata.stripe
//   //       delete stripe.card
//   //
//   //       // Remove current credit card
//   //       authManage.users.updateAppMetadata({
//   //         id: validUserContent.sub
//   //       }, {
//   //         stripe: stripe
//   //       }).then(() => {
//   //         chai.request(app)
//   //           .put('/v1/user/plan')
//   //           .set('Authorization', 'Bearer ' + validUserToken)
//   //           .send({ plan_id: 'invalidPlan' })
//   //           .end((err, res) => {
//   //             expect(err).to.be.not.null
//   //             expect(res).to.have.status(500)
//   //             expect(res).to.be.json
//   //             expect(res.body.message).to.be.equal('Please add a card to your account before choosing a plan.')
//   //             done()
//   //           })
//   //       })
//   //     })
//   //   })
//   // })
})
