import Promise from 'es6-promise'
import chai from 'chai'
import sinon from 'sinon'
import DynDBService from '../services/dyndb.service'
import ApplicationRedirectService from './application-redirect.service'

const assert = chai.assert
const expect = chai.expect

describe('./services/application-redirect.service', () => {
  const applicationRedirectService = new ApplicationRedirectService()

  describe('get', () => {
    let stubDynDBServiceGet

    before(() => {
      stubDynDBServiceGet = sinon.stub(DynDBService.prototype, 'get')
    })

    after(() => {
      DynDBService.prototype.get.restore()
    })

    it('success', (done) => {
      stubDynDBServiceGet.callsFake((params) => {
        return new Promise((resolve) => {
          resolve({
            Item: {
              id: params.keys.id,
              targetHost: 'www.google.com'
            }
          })
        })
      })

      applicationRedirectService.get({
        redirectId: 'redirect-id',
        applicationId: 'app-id'
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.id, 'redirect-id')
        assert.equal(item.targetHost, 'www.google.com')
        done()
      }).catch(err => done(err))
    })

    it('not found', (done) => {
      stubDynDBServiceGet.callsFake(() => {
        return new Promise((resolve) => {
          resolve({})
        })
      })

      applicationRedirectService.get({
        redirectId: 'redirect-id',
        applicationId: 'app-id'
      }).catch((err) => {
        assert.equal(err.name, 'RedirectNotFound')
        assert.equal(err.message, 'Redirect does not exist.')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceGet.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationRedirectService.get({
        redirectId: 'redirect-id',
        applicationId: 'app-id'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('create', () => {
    let stubDynDBServiceInsert

    before(() => {
      stubDynDBServiceInsert = sinon.stub(DynDBService.prototype, 'insert')
    })

    after(() => {
      DynDBService.prototype.insert.restore()
    })

    it('success', (done) => {
      stubDynDBServiceInsert.callsFake((params) => {
        return new Promise((resolve) => {
          resolve({
            id: params.item.id,
            targetHost: 'www.google.com'
          })
        })
      })

      applicationRedirectService.create({
        applicationId: 'app-id'
      }).then((item) => {
        expect(item).to.be.an('object')
        expect(item.id).to.be.a('string')
        assert.equal(item.targetHost, 'www.google.com')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceInsert.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationRedirectService.create({
        applicationId: 'app-id'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('redirectResponseHandler', () => {
    it('success', (done) => {
      const redirect = {
        id: 1,
        hostSources: 2,
        targetHost: 3,
        targetProtocol: 4,
        createdAt: 5,
        updatedAt: 6
      }
      const result = applicationRedirectService.redirectResponseHandler(redirect)
      expect(result).to.be.deep.equal(redirect)
      done()
    })
  })

  describe('delete', () => {
    let stubDynDBServiceDelete

    before(() => {
      stubDynDBServiceDelete = sinon.stub(DynDBService.prototype, 'delete')
    })

    after(() => {
      DynDBService.prototype.delete.restore()
    })

    it('success', (done) => {
      stubDynDBServiceDelete.resolves()

      applicationRedirectService.delete({
        redirectId: 'redirect-id',
        applicationId: 'app-id'
      }).then(() => {
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceDelete.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationRedirectService.delete({
        redirectId: 'redirect-id',
        applicationId: 'app-id'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('update', () => {
    let stubDynDBServiceUpdate

    before(() => {
      stubDynDBServiceUpdate = sinon.stub(DynDBService.prototype, 'update')
    })

    after(() => {
      DynDBService.prototype.update.restore()
    })

    it('success', (done) => {
      stubDynDBServiceUpdate.callsFake((params) => {
        return new Promise((resolve) => {
          resolve({
            targetHost: params.item.targetHost
          })
        })
      })

      applicationRedirectService.update({
        redirectId: 'redirect-id',
        applicationId: 'app-id'
      }, {
        targetHost: 'bbc.co.uk'
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.id, 'redirect-id')
        assert.equal(item.targetHost, 'bbc.co.uk')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceUpdate.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationRedirectService.update({
        redirectId: 'redirect-id',
        applicationId: 'app-id'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('getByApplicationId', () => {
    let stubDynDBServiceQuery

    before(() => {
      stubDynDBServiceQuery = sinon.stub(DynDBService.prototype, 'query')
    })

    after(() => {
      DynDBService.prototype.query.restore()
    })

    it('success', (done) => {
      stubDynDBServiceQuery.callsFake((params) => {
        return new Promise((resolve) => {
          resolve({
            Items: [
              { id: 1, applicationId: params.keys.applicationId },
              { id: 2, applicationId: params.keys.applicationId }
            ]
          })
        })
      })

      applicationRedirectService.getByApplicationId('app-id').then((item) => {
        expect(item).to.be.an('array')
        assert.equal(item[0].id, 1)
        assert.equal(item[0].applicationId, 'app-id')
        assert.equal(item[1].id, 2)
        assert.equal(item[1].applicationId, 'app-id')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceQuery.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationRedirectService.getByApplicationId('app-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('setByFileFromTo', () => {
    before(() => {
      sinon.stub(applicationRedirectService.fileConverter, 'add').resolves({
        jobId: 1
      })
    })

    after(() => {
      applicationRedirectService.fileConverter.add.restore()
    })

    it('success', (done) => {
      applicationRedirectService.setByFileFromTo({
        applicationId: 'app-id',
        redirectId: 'redirect-id',
        file: 'package.json'
      }).then((data) => {
        expect(data).to.be.an('object')
        assert.equal(data.queue, 'fileConverter')
        assert.equal(data.jobId, 1)
        done()
      }).catch(err => done(err))
    })

    it('should return fs error', (done) => {
      applicationRedirectService.setByFileFromTo({
        applicationId: 'app-id',
        redirectId: 'redirect-id',
        file: 'package.tmp'
      }).catch((err) => {
        assert.equal(err.code, 'ENOENT')
        done()
      }).catch(err => done(err))
    })
  })

  describe('setByJsonFromTo', () => {
    before(() => {
      sinon.stub(applicationRedirectService.fileConverter, 'add').resolves({
        jobId: 2
      })
    })

    after(() => {
      applicationRedirectService.fileConverter.add.restore()
    })

    it('success', (done) => {
      applicationRedirectService.setByJsonFromTo({
        applicationId: 'app-id',
        redirectId: 'redirect-id',
        jsonData: { content: 'OK' }
      }).then((data) => {
        expect(data).to.be.an('object')
        assert.equal(data.queue, 'fileConverter')
        assert.equal(data.jobId, 2)
        done()
      }).catch(err => done(err))
    })
  })

  describe('getFromToFile', () => {
    before(() => {
      sinon.stub(applicationRedirectService.fileReceiver, 'add').resolves({
        jobId: 3
      })
    })

    after(() => {
      applicationRedirectService.fileReceiver.add.restore()
    })

    it('success', (done) => {
      applicationRedirectService.getFromToFile({
        applicationId: 'app-id',
        redirectId: 'redirect-id',
        jsonData: { content: 'OK' }
      }).then((data) => {
        expect(data).to.be.an('object')
        assert.equal(data.queue, 'fileReceiver')
        assert.equal(data.jobId, 3)
        done()
      }).catch(err => done(err))
    })
  })

  describe('getJob', () => {
    let stubFileReceiverGetJob
    let data = {
      data: {
        applicationId: 'app-id',
        redirectId: 'redirect-id'
      },
      returnvalue: { content: 'OK' },
      _progress: 100,
      failedReason: ''
    }

    before(() => {
      stubFileReceiverGetJob = sinon.stub(applicationRedirectService.fileReceiver, 'getJob').resolves(data)
      sinon.stub(applicationRedirectService.fileConverter, 'getJob').resolves(data)
    })

    after(() => {
      applicationRedirectService.fileReceiver.getJob.restore()
      applicationRedirectService.fileConverter.getJob.restore()
    })

    it('fileConverter success', (done) => {
      applicationRedirectService.getJob({
        applicationId: 'app-id',
        redirectId: 'redirect-id',
        queue: 'fileConverter',
        jobId: '1'
      }).then((data) => {
        expect(data).to.be.an('object')
        assert.equal(data.progress, 100)
        assert.equal(data.failedReason, '')
        assert.equal(data.returnValue.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('fileReceiver success', (done) => {
      applicationRedirectService.getJob({
        applicationId: 'app-id',
        redirectId: 'redirect-id',
        queue: 'fileReceiver',
        jobId: '1'
      }).then((data) => {
        expect(data).to.be.an('object')
        assert.equal(data.progress, 100)
        assert.equal(data.failedReason, '')
        assert.equal(data.returnValue.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return Queue Not Found', (done) => {
      applicationRedirectService.getJob({
        applicationId: 'app-id',
        redirectId: 'redirect-id',
        queue: 'invalid-queue',
        jobId: '1'
      }).catch((err) => {
        expect(err).to.be.an('object')
        assert.equal(err.message, 'Queue Not Found.')
        done()
      }).catch(err => done(err))
    })

    it('should return Invalid JobId 1', (done) => {
      applicationRedirectService.getJob({
        applicationId: 'app-id',
        redirectId: 'invalid-redirect-id',
        queue: 'fileConverter',
        jobId: '1'
      }).catch((err) => {
        expect(err).to.be.an('object')
        assert.equal(err.message, 'Invalid jobId.')
        done()
      }).catch(err => done(err))
    })

    it('should return Invalid JobId 2', (done) => {
      delete data.data.applicationId
      stubFileReceiverGetJob.resolves(data)

      applicationRedirectService.getJob({
        applicationId: 'app-id',
        redirectId: 'invalid-redirect-id',
        queue: 'fileReceiver',
        jobId: '1'
      }).catch((err) => {
        expect(err).to.be.an('object')
        assert.equal(err.message, 'Invalid jobId.')
        done()
      }).catch(err => done(err))
    })
  })
})
