import chai from 'chai'
import mocksHttp from 'node-mocks-http'
import chaiJsonSchema from 'chai-json-schema'
import sinon from 'sinon'
import TestUtils from '../../test/utils'
import ApplicationRedirectService from '../../services/application-redirect.service'
import redirectCallback from './redirect.callback'
import IncomingForm from 'formidable'

const expect = chai.expect

chai.use(chaiJsonSchema)

describe('./routes/v1/redirect.callback', () => {
  let res
  let defaultReqParams = {
    application: null,
    redirect: null,
    user: {
      _id: userId,
      email: userEmail
    },
    params: {
      applicationId: null,
      redirectId: null
    }
  }

  // const applicationService = new ApplicationService()
  const userId = 'testRedirectCallbackSpecId'
  const userEmail = `${userId}@redirectpro.io`
  const testUtils = new TestUtils()

  const redirectSchema = {
    type: 'object',
    required: ['id', 'targetHost', 'targetProtocol', 'hostSources', 'updatedAt', 'createdAt'],
    properties: {
      id: { type: 'string' },
      targetHost: { type: 'string' },
      targetProtocol: { type: 'string' },
      hostSources: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      updatedAt: { type: 'number' },
      createdAt: { type: 'number' },
      objectKey: { type: ['string', 'null'] },
      objectLength: { type: ['number', 'null'] }
    }
  }

  before((done) => {
    testUtils.resetUser({
      userId: userId,
      userEmail: userEmail
    }).then((_application) => {
      defaultReqParams.application = _application
      defaultReqParams.params.applicationId = _application.id
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

  describe('getList', () => {
    it('should return an empty redirect array', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.an('array')
          expect(data).to.be.empty
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.getList(req, res)
    })
  })

  describe('post', () => {
    defaultReqParams = testUtils.mockValidator(defaultReqParams)

    it('add a redirect', (done) => {
      const jsonPost = {
        hostSources: [
          'www.google.com', 'www.bbc.co.uk', 'dw.de'
        ],
        targetHost: 'redirectpro.io',
        targetProtocol: 'http'
      }

      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        body: jsonPost
      }))

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(redirectSchema)
          expect(data.hostSources[0]).to.be.equal(jsonPost.hostSources[0])
          expect(data.hostSources[1]).to.be.equal(jsonPost.hostSources[1])
          expect(data.hostSources[2]).to.be.equal(jsonPost.hostSources[2])
          expect(data.targetProtocol).to.be.equal(jsonPost.targetProtocol)
          expect(data.targetHost).to.be.equal(jsonPost.targetHost)
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.post(req, res)
    })

    it('add another redirect', (done) => {
      const jsonPost = {
        hostSources: [
          'www.oldsite.com'
        ],
        targetHost: 'www.mynewsite.com',
        targetProtocol: 'https'
      }

      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        body: jsonPost
      }))

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(redirectSchema)
          expect(data.hostSources[0]).to.be.equal(jsonPost.hostSources[0])
          expect(data.hostSources[1]).to.be.equal(jsonPost.hostSources[1])
          expect(data.hostSources[2]).to.be.equal(jsonPost.hostSources[2])
          expect(data.targetProtocol).to.be.equal(jsonPost.targetProtocol)
          expect(data.targetHost).to.be.equal(jsonPost.targetHost)
          defaultReqParams.redirect = data
          defaultReqParams.params.redirectId = data.id
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.post(req, res)
    })

    it('should return validator error', (done) => {
      const jsonPost = {
        hostSources: [],
        targetHost: '',
        targetProtocol: 'https'
      }

      let reqParams = Object.create(defaultReqParams)
      reqParams = testUtils.mockValidator(reqParams, ['targetHost'])
      const req = mocksHttp.createRequest(Object.assign(reqParams, {
        body: jsonPost
      }))

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(data).to.be.an('array')
          expect(data[0].param).to.be.equal('targetHost')
          expect(data[0].msg).to.be.equal('Invalid targetHost')
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.post(req, res)
    })

    it('should return error', (done) => {
      const jsonPost = {
        hostSources: [
          'www.oldsite.com'
        ],
        targetHost: 'www.mynewsite.com',
        targetProtocol: 'https'
      }

      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        body: jsonPost
      }))

      sinon.stub(ApplicationRedirectService.prototype, 'create').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationRedirectService.prototype.create.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.post(req, res)
    })
  })

  describe('get', () => {
    it('success', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(redirectSchema)
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.get(req, res)
    })
  })

  describe('put', () => {
    it('success', (done) => {
      let putRedirectSchema = Object.create(redirectSchema)
      putRedirectSchema.required = putRedirectSchema.required.filter((e) => {
        return e.includes('id', 'targetHost', 'targetProtocol', 'hostSources', 'updatedAt')
      })

      const jsonPost = {
        hostSources: [
          'www.oldsite.com'
        ],
        targetHost: 'www.myother-newsite.com',
        targetProtocol: 'http'
      }

      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        body: jsonPost
      }))

      res.on('end', () => {
        try {
          const data = res._getData()
          if (data.createdAt === undefined) delete data.createdAt
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(putRedirectSchema)
          expect(data.hostSources[0]).to.be.equal(jsonPost.hostSources[0])
          expect(data.targetProtocol).to.be.equal(jsonPost.targetProtocol)
          expect(data.targetHost).to.be.equal(jsonPost.targetHost)
          defaultReqParams.redirect = data
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.put(req, res)
    })

    it('should return error', (done) => {
      const jsonPost = {
        hostSources: [
          'www.oldsite.com'
        ],
        targetHost: 'www.mynewsite.com',
        targetProtocol: 'https'
      }

      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        body: jsonPost
      }))

      sinon.stub(ApplicationRedirectService.prototype, 'update').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationRedirectService.prototype.update.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.put(req, res)
    })

    it('should return validator error', (done) => {
      const jsonPost = {
        hostSources: [],
        targetHost: '',
        targetProtocol: 'https'
      }

      let reqParams = Object.create(defaultReqParams)
      reqParams = testUtils.mockValidator(reqParams, ['targetHost'])
      const req = mocksHttp.createRequest(Object.assign(reqParams, {
        body: jsonPost
      }))

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(data).to.be.an('array')
          expect(data[0].param).to.be.equal('targetHost')
          expect(data[0].msg).to.be.equal('Invalid targetHost')
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.put(req, res)
    })
  })

  describe('postFromTo', () => {
    it('/fromTo post xlsx file format', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      }))

      sinon.stub(IncomingForm.prototype, 'parse').callsFake((req, cb) => {
        return cb(null, null, {
          file: {
            path: `${__dirname}/../../../test/test.xlsx`
          }
        })
      })

      const jobSchema = {
        type: 'object',
        required: ['jobId', 'queue'],
        properties: {
          queue: { type: 'string' },
          jobId: { type: 'string' }
        }
      }

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(jobSchema)
          expect(data.queue).to.be.equal('fileConverter')
          IncomingForm.prototype.parse.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.postFromTo(req, res)
    })

    it('/fromTo should return error posting xlsx', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      }))

      sinon.stub(IncomingForm.prototype, 'parse').callsFake((req, cb) => {
        return cb(null, null, {
          file: {
            path: `${__dirname}/../../../test/test.xlsx`
          }
        })
      })

      sinon.stub(ApplicationRedirectService.prototype, 'setByFileFromTo').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          IncomingForm.prototype.parse.restore()
          ApplicationRedirectService.prototype.setByFileFromTo.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.postFromTo(req, res)
    })

    it('/fromTo should return error on form.parse', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      }))

      sinon.stub(IncomingForm.prototype, 'parse').callsFake((req, cb) => {
        return cb({
          name: 'NAME',
          message: 'message'
        }, null, null)
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          IncomingForm.prototype.parse.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.postFromTo(req, res)
    })

    it('/fromTo post JSON', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        headers: {
          'Content-Type': 'application/json'
        },
        body: [
          { to: 'a', from: 'b' },
          { to: 'b', from: 'c' }
        ]
      }))

      const uploadSchema = {
        type: 'object',
        required: ['jobId', 'queue'],
        properties: {
          queue: { type: 'string' },
          jobId: { type: 'string' }
        }
      }

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(uploadSchema)
          expect(data.queue).to.be.equal('fileConverter')
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.postFromTo(req, res)
    })

    it('/fromTo should return error posting JSON', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        headers: {
          'Content-Type': 'application/json'
        },
        body: [
          { to: 'a', from: 'b' },
          { to: 'b', from: 'c' }
        ]
      }))

      sinon.stub(ApplicationRedirectService.prototype, 'setByJsonFromTo').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationRedirectService.prototype.setByJsonFromTo.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.postFromTo(req, res)
    })

    it('/fromTo should return empty', (done) => {
      const req = mocksHttp.createRequest(Object.assign(defaultReqParams, {
        headers: {}
      }))

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.deep.equal({})
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.postFromTo(req, res)
    })
  })

  describe('getFromTo', () => {
    it('success', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      const jobSchema = {
        type: 'object',
        required: ['jobId', 'queue'],
        properties: {
          queue: { type: 'string' },
          jobId: { type: 'string' }
        }
      }

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(jobSchema)
          expect(data.queue).to.be.equal('fileReceiver')
          defaultReqParams.params.jobId = data.jobId
          defaultReqParams.params.queue = data.queue
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.getFromTo(req, res)
    })

    it('should return error', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      sinon.stub(ApplicationRedirectService.prototype, 'getFromToFile').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationRedirectService.prototype.getFromToFile.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.getFromTo(req, res)
    })
  })

  describe('getJob', () => {
    it('success', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      const jobSchema = {
        type: 'object',
        required: ['progress', 'failedReason', 'returnValue'],
        properties: {
          progress: { type: 'number' },
          failedReason: { type: 'string' },
          returnValue: {
            type: ['object', 'null'],
            properties: {
              objectLength: { type: ['string', 'null'] }
            }
          }
        }
      }

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.jsonSchema(jobSchema)
          expect(data.progress).to.be.a('number')
          expect(data.failedReason).to.be.equal('')
          expect(data.returnValue).to.be.null
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.getJob(req, res)
    })

    it('should return error', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      sinon.stub(ApplicationRedirectService.prototype, 'getJob').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationRedirectService.prototype.getJob.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.getJob(req, res)
    })
  })

  describe('getList', () => {
    it('success', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      const listRedirectSchema = {
        type: 'array',
        items: redirectSchema
      }

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.be.an('array')
          expect(data).to.be.jsonSchema(listRedirectSchema)
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.getList(req, res)
    })

    it('should return error', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      sinon.stub(ApplicationRedirectService.prototype, 'getByApplicationId').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationRedirectService.prototype.getByApplicationId.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.getList(req, res)
    })
  })

  describe('delete', () => {
    it('success', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(200)
          expect(data).to.deep.equal({})
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.delete(req, res)
    })

    it('should return error', (done) => {
      const req = mocksHttp.createRequest(defaultReqParams)

      sinon.stub(ApplicationRedirectService.prototype, 'delete').rejects({
        name: 'NAME',
        message: 'message'
      })

      res.on('end', () => {
        try {
          const data = res._getData()
          expect(res.statusCode).to.be.equal(500)
          expect(data.message).to.be.equal('message')
          ApplicationRedirectService.prototype.delete.restore()
          done()
        } catch (err) {
          done(err)
        }
      })

      redirectCallback.delete(req, res)
    })
  })
})
