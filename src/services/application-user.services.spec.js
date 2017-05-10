import Promise from 'es6-promise'
import chai from 'chai'
import sinon from 'sinon'
import DynDBService from '../services/dyndb.service'
import ApplicationUserService from './application-user.service'

const assert = chai.assert
const expect = chai.expect

describe('./services/application-user.service', () => {
  const applicationUserService = new ApplicationUserService({})

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
              id: params.keys.id
            }
          })
        })
      })

      applicationUserService.get('user-id').then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.id, 'user-id')
        done()
      }).catch(err => done(err))
    })

    it('not found', (done) => {
      stubDynDBServiceGet.callsFake(() => {
        return new Promise((resolve) => {
          resolve({})
        })
      })

      applicationUserService.get('user-id-not-found').catch((err) => {
        assert.equal(err.name, 'UserNotFound')
        assert.equal(err.message, 'User does not exist.')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceGet.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationUserService.get('user-id').catch((err) => {
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
            id: params.item.id
          })
        })
      })

      applicationUserService.create('user-id').then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.id, 'user-id')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceInsert.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationUserService.create({
        applicationId: 'app-id'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('delete', () => {
    let stubDynDBServiceDelete

    before(() => {
      stubDynDBServiceDelete = sinon.stub(DynDBService.prototype, 'delete')

      sinon.stub(ApplicationUserService.prototype, 'getApplications').resolves([
        { applicationId: 'other-id', userId: 'other-user-id' }
      ])
    })

    after(() => {
      DynDBService.prototype.delete.restore()
      ApplicationUserService.prototype.getApplications.restore()
    })

    it('success', (done) => {
      stubDynDBServiceDelete.resolves()

      applicationUserService.delete('user-id').then(() => {
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceDelete.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationUserService.delete('user-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('consolidateProfile', () => {
    let stubApplicationUserServiceGetApplications
    let stubApplicationUserServiceGet; let stubApplicationUserServiceCreate

    before(() => {
      stubApplicationUserServiceGetApplications = sinon.stub(ApplicationUserService.prototype, 'getApplications')
      stubApplicationUserServiceGetApplications.resolves([
        { applicationId: '1' },
        { applicationId: '2' }
      ])

      stubApplicationUserServiceGet = sinon.stub(ApplicationUserService.prototype, 'get')
      stubApplicationUserServiceCreate = sinon.stub(ApplicationUserService.prototype, 'create')
    })

    after(() => {
      ApplicationUserService.prototype.getApplications.restore()
      ApplicationUserService.prototype.get.restore()
      ApplicationUserService.prototype.create.restore()
    })

    it('get existing user', (done) => {
      stubApplicationUserServiceGet.callsFake((userId) => {
        return new Promise((resolve) => {
          resolve({ id: userId })
        })
      })

      applicationUserService.consolidateProfile({
        userId: 'user-id',
        userEmail: 'user-email@email.com'
      }).then((item) => {
        expect(item).to.be.an('object')
        expect(item.user).to.be.an('object')
        expect(item.applications).to.be.an('array')
        assert.equal(item.user.id, 'user-id')
        assert.equal(item.applications[0].id, '1')
        done()
      }).catch(err => done(err))
    })

    it('create user', (done) => {
      stubApplicationUserServiceGet.rejects({
        name: 'UserNotFound',
        message: 'user-not-found'
      })

      stubApplicationUserServiceCreate.callsFake((userId) => {
        return new Promise((resolve) => {
          resolve({ id: userId })
        })
      })

      applicationUserService.consolidateProfile({
        userId: 'user-id',
        userEmail: 'user-email@email.com'
      }).then((item) => {
        expect(item).to.be.an('object')
        expect(item.user).to.be.an('object')
        expect(item.applications).to.be.an('array')
        assert.equal(item.user.id, 'user-id')
        assert.equal(item.applications[0].id, '1')
        done()
      }).catch(err => done(err))
    })

    it('should return error when creating user 1', (done) => {
      stubApplicationUserServiceGet.rejects({
        name: 'UserNotFound',
        message: 'user-not-found'
      })

      stubApplicationUserServiceCreate.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationUserService.consolidateProfile({
        userId: 'user-id',
        userEmail: 'user-email@email.com'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })

    it('should return error when creating user 2', (done) => {
      stubApplicationUserServiceGet.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationUserService.consolidateProfile({
        userId: 'user-id',
        userEmail: 'user-email@email.com'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })

    it('create application', (done) => {
      stubApplicationUserServiceGet.callsFake((userId) => {
        return new Promise((resolve) => {
          resolve({ id: userId })
        })
      })
      stubApplicationUserServiceGetApplications.resolves([])
      applicationUserService.applicationService.create = () => {
        return new Promise((resolve) => {
          resolve({
            id: 'app-id'
          })
        })
      }
      applicationUserService.consolidateProfile({
        userId: 'user-id',
        userEmail: 'user-email@email.com'
      }).then((item) => {
        expect(item).to.be.an('object')
        expect(item.user).to.be.an('object')
        expect(item.applications).to.be.an('array')
        assert.equal(item.user.id, 'user-id')
        assert.equal(item.applications[0].id, 'app-id')
        done()
      }).catch(err => done(err))
    })

    it('should return error when creating application', (done) => {
      stubApplicationUserServiceGet.callsFake((userId) => {
        return new Promise((resolve) => {
          resolve({ id: userId })
        })
      })
      stubApplicationUserServiceGetApplications.resolves([])
      applicationUserService.applicationService.create = () => {
        return Promise.reject({
          name: 'NAME',
          message: 'message'
        })
      }
      applicationUserService.consolidateProfile({
        userId: 'user-id',
        userEmail: 'user-email@email.com'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('getProfile', () => {
    let stubApplicationUserConsolidateConsolidate

    before(() => {
      stubApplicationUserConsolidateConsolidate = sinon.stub(ApplicationUserService.prototype, 'consolidateProfile')
    })

    after(() => {
      ApplicationUserService.prototype.consolidateProfile.restore()
    })

    it('success', (done) => {
      stubApplicationUserConsolidateConsolidate.resolves({
        content: 'OK'
      })

      applicationUserService.getProfile({
        userId: 'user-id',
        userEmail: 'user-email@email.com'
      }).then((item) => {
        expect(item).to.be.an('object')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubApplicationUserConsolidateConsolidate.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationUserService.getProfile({
        userId: 'user-id',
        userEmail: 'user-email@email.com'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('isAuthorized', () => {
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
              id: params.userId
            }
          })
        })
      })

      applicationUserService.isAuthorized({
        applicationId: 'app-id',
        userId: 'user-id'
      }).then((authorized) => {
        assert.equal(authorized, true)
        done()
      }).catch(err => done(err))
    })

    it('should return permission denied', (done) => {
      stubDynDBServiceGet.callsFake(() => {
        return new Promise((resolve) => {
          resolve({})
        })
      })

      applicationUserService.isAuthorized({
        applicationId: 'app-id',
        userId: 'user-id'
      }).catch((err) => {
        assert.equal(err.name, 'PermissionDenied')
        assert.equal(err.message, 'Permission Denied.')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceGet.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationUserService.isAuthorized({
        applicationId: 'app-id',
        userId: 'user-id'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('getApplications', () => {
    let stubDynDBServiceQuery

    before(() => {
      stubDynDBServiceQuery = sinon.stub(DynDBService.prototype, 'query')
    })

    after(() => {
      DynDBService.prototype.query.restore()
    })

    it('success', (done) => {
      stubDynDBServiceQuery.resolves({
        Items: [ { content: 'OK' } ]
      })

      applicationUserService.getApplications('user-id').then((items) => {
        expect(items).to.be.an('array')
        assert.equal(items[0].content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceQuery.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationUserService.getApplications('user-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })
})
