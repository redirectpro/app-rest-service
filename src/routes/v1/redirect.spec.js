import Promise from 'es6-promise'
import chai from 'chai'
import chaiHttp from 'chai-http'
import chaiJsonSchema from 'chai-json-schema'
import app from '../../test/app'
import TestUtils from '../../test/utils'
import ApplicatinService from '../../services/application.service'
import fs from 'fs'

const expect = chai.expect

chai.use(chaiHttp)
chai.use(chaiJsonSchema)

describe('./v1/:applicationId/redirect', () => {
  const applicationService = new ApplicatinService()
  const userId = 'testRedirectSpecId'
  const testUtils = new TestUtils()
  const accessToken = testUtils.genAccessToken({
    'email': `${userId}@redirectpro.io`,
    'sub': `auth0|${userId}`
  })

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

  let applicationId
  let redirectId
  let jobId

  before((done) => {
    applicationService.user.getApplications(userId).then((items) => {
      let promises = []

      for (let item of items) {
        let p1 = applicationService.delete(item.applicationId)
        let p2 = applicationService.user.delete(item.userId)
        promises.push(p1)
        promises.push(p2)
      }

      return Promise.all(promises)
    }).then(() => {
      done()
    }).catch((err) => {
      done(err)
    })
  })

  describe('../../user/profile', () => {
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

  describe('../redirects', () => {
    it('should return an empty redirect array', (done) => {
      chai.request(app)
        .get(`/v1/${applicationId}/redirects`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.empty
          done()
        })
    })
  })

  describe('/', () => {
    it('add a redirect', (done) => {
      let jsonPost = {
        hostSources: [
          'www.google.com', 'www.bbc.co.uk', 'dw.de'
        ],
        targetHost: 'redirectpro.io',
        targetProtocol: 'http'
      }

      chai.request(app)
        .post(`/v1/${applicationId}/redirect`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(jsonPost)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(redirectSchema)
          expect(res.body.hostSources[0]).to.be.equal(jsonPost.hostSources[0])
          expect(res.body.hostSources[1]).to.be.equal(jsonPost.hostSources[1])
          expect(res.body.hostSources[2]).to.be.equal(jsonPost.hostSources[2])
          expect(res.body.targetProtocol).to.be.equal(jsonPost.targetProtocol)
          expect(res.body.targetHost).to.be.equal(jsonPost.targetHost)
          done()
        })
    })

    it('add another redirect', (done) => {
      let jsonPost = {
        hostSources: [
          'www.oldsite.com'
        ],
        targetHost: 'www.mynewsite.com',
        targetProtocol: 'https'
      }

      chai.request(app)
        .post(`/v1/${applicationId}/redirect`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(jsonPost)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(redirectSchema)
          expect(res.body.hostSources[0]).to.be.equal(jsonPost.hostSources[0])
          expect(res.body.targetProtocol).to.be.equal(jsonPost.targetProtocol)
          expect(res.body.targetHost).to.be.equal(jsonPost.targetHost)
          redirectId = res.body.id
          done()
        })
    })

    it('should return error', (done) => {
      let jsonPost = {
        hostSources: [
          ''
        ],
        targetHost: '',
        targetProtocol: 'ftp'
      }

      chai.request(app)
        .post(`/v1/${applicationId}/redirect`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(jsonPost)
        .end((err, res) => {
          expect(err).to.be.not.null
          expect(res).to.have.status(400)
          expect(res).to.be.json
          done()
        })
    })
  })

  describe('/:redirectId', () => {
    it('update redirect with new target and protocol', (done) => {
      let putRedirectSchema = Object.create(redirectSchema)
      putRedirectSchema.required = putRedirectSchema.required.filter((e) => {
        return e.includes('id', 'targetHost', 'targetProtocol', 'hostSources', 'updatedAt')
      })

      let jsonPost = {
        hostSources: [
          'www.oldsite.com'
        ],
        targetHost: 'www.myother-newsite.com',
        targetProtocol: 'http'
      }

      chai.request(app)
        .put(`/v1/${applicationId}/redirect/${redirectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(jsonPost)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(putRedirectSchema)
          expect(res.body.hostSources[0]).to.be.equal(jsonPost.hostSources[0])
          expect(res.body.targetProtocol).to.be.equal(jsonPost.targetProtocol)
          expect(res.body.targetHost).to.be.equal(jsonPost.targetHost)
          done()
        })
    })

    it('/fromTo post xlsx file format', (done) => {
      const uploadSchema = {
        type: 'object',
        required: ['jobId', 'queue'],
        properties: {
          queue: { type: 'string' },
          jobId: { type: 'string' }
        }
      }

      chai.request(app)
        .post(`/v1/${applicationId}/redirect/${redirectId}/fromTo`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fs.readFileSync('./test/test.xlsx'), 'test.xlsx')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(uploadSchema)
          expect(res.body.queue).to.be.equal('fileConverter')
          jobId = res.body.jobId
          done()
        })
    })

    it('/job/:queue/:jobId get jobId status from fileConverter', (done) => {
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

      chai.request(app)
        .get(`/v1/${applicationId}/redirect/${redirectId}/job/fileConverter/${jobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(jobSchema)
          expect(res.body.progress).to.be.a('number')
          expect(res.body.failedReason).to.be.equal('')
          expect(res.body.returnValue).to.be.null
          done()
        })
    })

    it('delete redirect', (done) => {
      chai.request(app)
        .delete(`/v1/${applicationId}/redirect/${redirectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          done()
        })
    })
  })

  describe('../redirects', () => {
    it('should return a array with one element', (done) => {
      const listRedirectSchema = {
        type: 'array',
        items: redirectSchema
      }

      chai.request(app)
        .get(`/v1/${applicationId}/redirects`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.jsonSchema(listRedirectSchema)
          done()
        })
    })
  })
})
