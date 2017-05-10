import Promise from 'es6-promise'
import chai from 'chai'
import sinon from 'sinon'
import StripeService from './stripe.service'
import DynDBService from '../services/dyndb.service'
import ApplicationService from './application.service'

const assert = chai.assert
const expect = chai.expect

describe('./services/application.service', () => {
  const applicationService = new ApplicationService({})

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

      applicationService.get('app-id').then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.id, 'app-id')
        done()
      }).catch(err => done(err))
    })

    it('should return not found', (done) => {
      stubDynDBServiceGet.callsFake(() => {
        return new Promise((resolve) => {
          resolve({})
        })
      })

      applicationService.get('app-id-not-found').catch((err) => {
        assert.equal(err.name, 'ApplicationNotFound')
        assert.equal(err.message, 'Application does not exist.')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubDynDBServiceGet.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationService.get('app-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('create', () => {
    let stubDynDBServiceInsert; let stubStripeServiceCreate

    before(() => {
      stubDynDBServiceInsert = sinon.stub(DynDBService.prototype, 'insert')
      stubStripeServiceCreate = sinon.stub(StripeService.prototype, 'create')
    })

    after(() => {
      DynDBService.prototype.insert.restore()
      StripeService.prototype.create.restore()
    })

    it('success', (done) => {
      stubDynDBServiceInsert.callsFake((params) => {
        return new Promise((resolve) => {
          resolve(params.item)
        })
      })

      stubStripeServiceCreate.resolves({
        id: 'app-id',
        subscriptions: {
          data: [
            {
              id: 'subscription-id',
              plan: {
                id: 'plan-id'
              }
            }
          ]
        }
      })

      applicationService.create({
        userId: 'user-id',
        userEmail: 'user-email@email.com',
        planId: 'personal'
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.id, 'app-id')
        assert.equal(item.billingEmail, 'user-email@email.com')
        assert.equal(item.subscription.plan.id, 'plan-id')
        done()
      }).catch(err => done(err))
    })

    it('should return error 1', (done) => {
      stubDynDBServiceInsert.rejects({
        name: 'NAME',
        message: 'message'
      })

      stubStripeServiceCreate.resolves({
        id: 'app-id',
        subscriptions: {
          data: [
            {
              id: 'subscription-id',
              plan: {
                id: 'plan-id'
              }
            }
          ]
        }
      })

      applicationService.create({
        userId: 'user-id',
        userEmail: 'user-email@email.com',
        planId: 'personal'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })

    it('should return error 2', (done) => {
      stubStripeServiceCreate.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationService.create({
        userId: 'user-id',
        userEmail: 'user-email@email.com',
        planId: 'personal'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('delete', () => {
    let stubApplicationServiceGetUsers

    before(() => {
      sinon.stub(StripeService.prototype, 'delete').resolves({})
      sinon.stub(DynDBService.prototype, 'delete').resolves({})

      stubApplicationServiceGetUsers = sinon.stub(ApplicationService.prototype, 'getUsers')
    })

    after(() => {
      StripeService.prototype.delete.restore()
      DynDBService.prototype.delete.restore()
      ApplicationService.prototype.getUsers.restore()
    })

    it('success', (done) => {
      stubApplicationServiceGetUsers.resolves([
        {
          applicationId: 'app-id',
          userId: 'user-id'
        }
      ])

      applicationService.delete('app-id').then(() => {
        done()
      }).catch(err => done(err))
    })

    it('should return customer not found', (done) => {
      stubApplicationServiceGetUsers.rejects({
        name: 'NAME',
        message: 'No such customer: app-id'
      })

      applicationService.delete('app-id').then(() => {
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubApplicationServiceGetUsers.rejects({
        name: 'NAME',
        message: 'message'
      })

      applicationService.delete('app-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('getUsers', () => {
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

      applicationService.getUsers('app-id').then((items) => {
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

      applicationService.getUsers('user-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })
})
