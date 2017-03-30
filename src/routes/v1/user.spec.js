import chai from 'chai'
import chaiHttp from 'chai-http'
import chaiJsonSchema from 'chai-json-schema'
import app from '../../test/app'
import TestUtils from '../../test/utils'
import ApplicatinService from '../../services/application.service'

const expect = chai.expect

chai.use(chaiHttp)
chai.use(chaiJsonSchema)

describe('./v1/user', () => {
  const userId = 'testUserSpecId'
  const testUtils = new TestUtils()
  const accessToken = testUtils.genAccessToken({
    'email': `${userId}@redirectpro.io`,
    'sub': `auth0|${userId}`
  })

  before((done) => {
    const applicationService = new ApplicatinService()
    applicationService.user.delete(userId, true).then(() => {
      done()
    }).catch((err) => {
      done(err)
    })
  })

  describe('/profile', () => {
    const profileSchema = {
      type: 'object',
      required: ['id', 'applications'],
      properties: {
        id: { type: 'string' },
        applications: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string' }
            }
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

    it('should return user profile - first access', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema)
          done()
        })
    })

    it('should return user profile - second access', (done) => {
      chai.request(app)
        .get('/v1/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(profileSchema)
          done()
        })
    })
  })
})
