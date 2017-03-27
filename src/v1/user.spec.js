import chai from 'chai'
import chaiHttp from 'chai-http'
import chaiJsonSchema from 'chai-json-schema'
import app from '../test/index'
import config from '../config'
import jwt from 'jsonwebtoken'
import UserService from '../services/user.service'

const expect = chai.expect

chai.use(chaiHttp)
chai.use(chaiJsonSchema)

describe('./v1/user', () => {
  const userId = 'testUserSpecId'
  let validUserContent = {
    'email': 'testV1User@redirectpro.io',
    'email_verified': true,
    'iss': 'https://keepat.eu.auth0.com/',
    'sub': `auth0|${userId}`,
    'aud': 'n1K6ZPkvgD7eLuKLXCBOy8d3dfnKlTAc',
    'iat': Math.floor(Date.now() / 1000) - 30,
    'exp': Math.floor(Date.now() / 1000) - 30 + 3600
  }
  // let invalidUserContent = Object.assign({}, validUserContent)
  // invalidUserContent.sub = 'auth0|588930ba74e3aa709a591777'

  const validUserToken = jwt.sign(validUserContent, config.jwtSecret)
  // const invalidUserToken = jwt.sign(invalidUserContent, config.jwtSecret)

  // const testInvalidUser = (method, endpoint, done) => {
  //   let request = chai.request(app)
  //
  //   if (method === 'get') {
  //     request = request.get(endpoint)
  //   } else if (method === 'put') {
  //     request = request.put(endpoint)
  //   } else if (method === 'post') {
  //     request = request.post(endpoint)
  //   }
  //
  //   request
  //     .set('Authorization', 'Bearer ' + invalidUserToken)
  //     .end((err, res) => {
  //       expect(err).to.be.not.null
  //       expect(res).to.have.status(500)
  //       expect(res).to.be.json
  //       expect(res.body.message).to.be.equal('User not found.')
  //       done()
  //     })
  // }

  before((done) => {
    const userService = new UserService()

    userService.delete(userId, true).then(() => {
      done()
    }).catch((err) => {
      done(err)
    })

  //   authClient.tokens.getInfo(validUserToken, (err, userInfo) => {
  //     if (err) return false
  //
  //     if (!userInfo.app_metadata ||
  //       !userInfo.app_metadata.stripe ||
  //       !userInfo.app_metadata.stripe.customer_id) {
  //       done()
  //     } else {
  //       let customerId = userInfo.app_metadata.stripe.customer_id
  //
  //       stripeClient.customers.del(customerId, (err) => {
  //         if (err && err.message === 'No such customer: ' + customerId) {
  //           true
  //         } else if (err) {
  //           console.log(err)
  //           return false
  //         }
  //
  //         authManage.users.updateAppMetadata({
  //           id: validUserContent.sub
  //         }, null).then(() => {
  //           done()
  //         })
  //       })
  //     }
  //   })
  })

  describe('/profile', () => {
    const profileSchema = {
      title: 'profile',
      type: 'object',
      required: ['id', 'applications'],
      properties: {
        id: { type: 'string' },
        applications: {
          type: 'array',
          properties: {
            id: { type: 'string' }
          }
        }
      }
    }

    it('should fail, as expected, no authentication sent', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(401)
          expect(res).to.be.json
          done()
        })
    })

    // it.only('should fail, invalid user', (done) => {
    //   testInvalidUser('get', '/v1/user/profile', done)
    // })

    it('should return user profile - first access', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .set('Authorization', 'Bearer ' + validUserToken)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema)
          // expect(res.body.stripe.plan_id).to.be.equal('personal')
          done()
        })
    })

    it('should return user profile - second access', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .set('Authorization', 'Bearer ' + validUserToken)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema)
          // expect(res.body.stripe.plan_id).to.be.equal('personal')
          done()
        })
    })
  })
})
