import Promise from 'es6-promise'
import chai from 'chai'
import sinon from 'sinon'
import StripeService from './stripe.service'

const assert = chai.assert
const expect = chai.expect

describe('./services/stripe.service', () => {
  const stripeService = new StripeService({})

  describe('get', () => {
    let stubStripeCustomersRetrieve

    before(() => {
      stubStripeCustomersRetrieve = sinon.stub(stripeService.stripe.customers, 'retrieve')
    })

    after(() => {
      stripeService.stripe.customers.retrieve.restore()
    })

    it('success', (done) => {
      stubStripeCustomersRetrieve.resolves({
        subscriptions: {
          total_count: 1
        },
        content: 'OK'
      })

      stripeService.get('customer-id').then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return subscription not found', (done) => {
      stubStripeCustomersRetrieve.resolves({
        subscriptions: {
          total_count: 0
        },
        content: 'OK'
      })

      stripeService.get('customer-id').catch((err) => {
        assert.equal(err.name, 'SubscriptionNotFound')
        assert.equal(err.message, 'Subscription not found.')
        done()
      }).catch(err => done(err))
    })

    it('should return multiples subscriptions', (done) => {
      stubStripeCustomersRetrieve.resolves({
        subscriptions: {
          total_count: 2
        },
        content: 'OK'
      })

      stripeService.get('customer-id').catch((err) => {
        assert.equal(err.name, 'MultipleSubscriptions')
        assert.equal(err.message, 'I can\'t handle multiples subscriptions.')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeCustomersRetrieve.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.get('customer-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('create', () => {
    let stubStripeCustomersCreate; let stubStripeServiceCreateSubscription

    before(() => {
      stubStripeCustomersCreate = sinon.stub(stripeService.stripe.customers, 'create')
      stubStripeServiceCreateSubscription = sinon.stub(StripeService.prototype, 'createSubscription')
    })

    after(() => {
      stripeService.stripe.customers.create.restore()
      StripeService.prototype.createSubscription.restore()
    })

    it('success', (done) => {
      stubStripeCustomersCreate.resolves({
        id: 'app-id',
        subscriptions: {
          data: []
        }
      })

      stubStripeServiceCreateSubscription.callsFake((params) => {
        return new Promise((resolve) => {
          resolve({
            planId: params.planId
          })
        })
      })

      stripeService.create({
        userEmail: 'user-email@mail.com',
        planId: 'personal'
      }).then((item) => {
        expect(item).to.be.an('object')
        expect(item.subscriptions.data).to.be.an('array')
        assert.equal(item.id, 'app-id')
        assert.equal(item.subscriptions.data[0].planId, 'personal')
        done()
      }).catch(err => done(err))
    })

    it('should return create subscription error', (done) => {
      stubStripeCustomersCreate.resolves({
        id: 'app-id',
        subscriptions: {
          data: []
        }
      })

      stubStripeServiceCreateSubscription.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.create({
        userEmail: 'user-email@mail.com',
        planId: 'personal'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeCustomersCreate.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.create({
        userEmail: 'user-email@mail.com',
        planId: 'personal'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('delete', () => {
    let stubStripeCustomersDel

    before(() => {
      stubStripeCustomersDel = sinon.stub(stripeService.stripe.customers, 'del')
    })

    after(() => {
      stripeService.stripe.customers.del.restore()
    })

    it('success', (done) => {
      stubStripeCustomersDel.resolves({
        content: 'OK'
      })

      stripeService.delete('app-id').then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeCustomersDel.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.delete('app-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('createSubscription', () => {
    let stubStripeSubscriptionsCreate

    before(() => {
      stubStripeSubscriptionsCreate = sinon.stub(stripeService.stripe.subscriptions, 'create')
    })

    after(() => {
      stripeService.stripe.subscriptions.create.restore()
    })

    it('success', (done) => {
      stubStripeSubscriptionsCreate.resolves({
        content: 'OK'
      })

      stripeService.createSubscription({
        id: 'app-id',
        planId: 'personal'
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeSubscriptionsCreate.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.createSubscription({
        id: 'app-id',
        planId: 'personal'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('updateSubscription', () => {
    let stubStripeSubscriptionsUpdate

    before(() => {
      stubStripeSubscriptionsUpdate = sinon.stub(stripeService.stripe.subscriptions, 'update')
    })

    after(() => {
      stripeService.stripe.subscriptions.update.restore()
    })

    it('success', (done) => {
      stubStripeSubscriptionsUpdate.resolves({
        content: 'OK'
      })

      stripeService.updateSubscription({
        id: 'app-id',
        planId: 'personal'
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeSubscriptionsUpdate.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.updateSubscription({
        id: 'app-id',
        planId: 'personal'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('delSubscription', () => {
    let stubStripeSubscriptionsDel

    before(() => {
      stubStripeSubscriptionsDel = sinon.stub(stripeService.stripe.subscriptions, 'del')
    })

    after(() => {
      stripeService.stripe.subscriptions.del.restore()
    })

    it('success', (done) => {
      stubStripeSubscriptionsDel.resolves({
        content: 'OK'
      })

      stripeService.delSubscription({
        id: 'app-id',
        at_period_end: true
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeSubscriptionsDel.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.delSubscription({
        id: 'app-id',
        planId: 'personal'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('retrieveToken', () => {
    let stubStripeRetrieveToken

    before(() => {
      stubStripeRetrieveToken = sinon.stub(stripeService.stripe.tokens, 'retrieve')
    })

    after(() => {
      stripeService.stripe.tokens.retrieve.restore()
    })

    it('success', (done) => {
      stubStripeRetrieveToken.resolves({
        content: 'OK'
      })

      stripeService.retrieveToken('token').then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeRetrieveToken.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.retrieveToken('token').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('createToken', () => {
    let stubStripeCreateToken

    before(() => {
      stubStripeCreateToken = sinon.stub(stripeService.stripe.tokens, 'create')
    })

    after(() => {
      stripeService.stripe.tokens.create.restore()
    })

    it('success', (done) => {
      stubStripeCreateToken.resolves({
        content: 'OK'
      })

      stripeService.createToken({
        param1: 'param1'
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeCreateToken.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.createToken({
        param1: 'param1'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('updateCreditCard', () => {
    let stubStripeCustomerUpdate

    before(() => {
      stubStripeCustomerUpdate = sinon.stub(stripeService.stripe.customers, 'update')
    })

    after(() => {
      stripeService.stripe.customers.update.restore()
    })

    it('success', (done) => {
      stubStripeCustomerUpdate.resolves({
        content: 'OK'
      })

      stripeService.updateCreditCard({
        param1: 'param1'
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeCustomerUpdate.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.updateCreditCard({
        param1: 'param1'
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('retrieveUpcomingInvoices', () => {
    let stubStripeInvoicesRetrieveUpcoming

    before(() => {
      stubStripeInvoicesRetrieveUpcoming = sinon.stub(stripeService.stripe.invoices, 'retrieveUpcoming')
    })

    after(() => {
      stripeService.stripe.invoices.retrieveUpcoming.restore()
    })

    it('success', (done) => {
      stubStripeInvoicesRetrieveUpcoming.resolves({
        content: 'OK'
      })

      stripeService.retrieveUpcomingInvoices({
        customerId: 'app-id',
        subscriptionId: 'subscription-id',
        planId: 'plan-id',
        prorationDate: 1
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeInvoicesRetrieveUpcoming.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.retrieveUpcomingInvoices({
        customerId: 'app-id',
        subscriptionId: 'subscription-id',
        planId: 'plan-id',
        prorationDate: 1
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('retrieveEvent', () => {
    let stubStripeEventsRetrieve

    before(() => {
      stubStripeEventsRetrieve = sinon.stub(stripeService.stripe.events, 'retrieve')
    })

    after(() => {
      stripeService.stripe.events.retrieve.restore()
    })

    it('success', (done) => {
      stubStripeEventsRetrieve.resolves({
        content: 'OK'
      })

      stripeService.retrieveEvent('event-id').then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubStripeEventsRetrieve.rejects({
        name: 'NAME',
        message: 'message'
      })

      stripeService.retrieveEvent('event-id').catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })
})
