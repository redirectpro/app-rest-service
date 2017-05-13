import chai from 'chai'
import mocksHttp from 'node-mocks-http'
import chaiJsonSchema from 'chai-json-schema'
import sinon from 'sinon'
import TestUtils from '../../test/utils'
import ApplicationUserService from '../../services/application-user.service'
import userCallback from './user.callback'

const assert = chai.assert
const expect = chai.expect

chai.use(chaiJsonSchema)

describe('./routes/v1/user.callback', () => {
  let req; let res
  const userId = 'testUserCallbackSpecId'
  const userEmail = `${userId}@redirectpro.io`
  const testUtils = new TestUtils()

  before((done) => {
    testUtils.deleteUser(userId).then(() => {
      done()
    }).catch((err) => {
      done(err)
    })
  })

  beforeEach(() => {
    req = mocksHttp.createRequest({
      user: {
        _id: userId,
        email: userEmail
      }
    })

    res = mocksHttp.createResponse({
      eventEmitter: require('events').EventEmitter
    })
  })

  describe('getUserProfile', () => {
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

    it('should return user profile - first access', (done) => {
      res.on('end', () => {
        try {
          const data = res._getData()
          assert.equal(res.statusCode, 200)
          expect(data).to.be.an('object')
          expect(data).to.be.jsonSchema(profileSchema)
          done()
        } catch (err) {
          done(err)
        }
      })

      userCallback.getProfile(req, res)
    })

    it('should return user profile - second access', (done) => {
      res.on('end', () => {
        try {
          const data = res._getData()
          assert.equal(res.statusCode, 200)
          expect(data).to.be.an('object')
          expect(data).to.be.jsonSchema(profileSchema)
          done()
        } catch (err) {
          done(err)
        }
      })

      userCallback.getProfile(req, res)
    })

    it('should return error', (done) => {
      sinon.stub(ApplicationUserService.prototype, 'getProfile').rejects({
        name: 'NAME',
        message: 'message'
      })

      const invalidReq = mocksHttp.createRequest({
        user: {
          _id: 'user-invalid-id',
          email: 'user-invalid-email'
        }
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(data).to.be.an('object')
          assert.equal(res.statusCode, 500)
          assert.equal(data.message, 'message')
          ApplicationUserService.prototype.getProfile.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      userCallback.getProfile(invalidReq, res)
    })
  })
})
