import Promise from 'es6-promise'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from './dyndb.service'
import StripeService from './stripe.service'
const logger = LoggerHandler
const path = 'application.service'

export default class ApplicationService {

  constructor () {
    this.stripeService = new StripeService()
    this.dyndbService = new DynDBService()
  }

  get (applicationId) {
    const _path = `${path} get`
    logger.info(`${_path} ${applicationId}`)

    return new Promise((resolve, reject) => {
      this.dyndbService.get('application', { id: applicationId }).then((data) => {
        logger.info(`${_path} result of this.dyndbService.get then`)

        if (data.Items[0]) {
          return resolve(data.Items[0])
        } else {
          return reject(ErrorHandler.typeError('ApplicationNotFound', 'Application does not exist.'))
        }
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  create (parameters) {
    const _path = `${path} create`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripeService.create({
        userEmail: parameters.userEmail,
        planId: parameters.planId
      }).then((customer) => {
        logger.info(`${_path} result of stripeService.create then`)

        const item = {
          id: customer.id,
          users: [ parameters.userId ],
          billingEmail: parameters.userEmail,
          subscription: this.subscriptionResponseHandler(customer.subscriptions.data[0])
        }

        this.dyndbService.insert('application', item).then((item) => {
          logger.info(`${_path} result of this.dyndbService.insert then`)
          return resolve(item)
        }).catch((err) => {
          logger.warn(`${_path} result of this.dyndbService.insert catch`)
          return reject(err)
        })
      }).catch((err) => {
        logger.warn(`${_path} result of stripeService.create catch`, err.name)
        return reject(err)
      })
    })
  }

  delete (applicationId) {
    const _path = `${path} delete`
    logger.info(`${_path} ${applicationId}`)

    return new Promise((resolve, reject) => {
      let promiseDeleteStripe = this.stripeService.delete(applicationId)
      let promiseDeleteDynDB = this.dyndbService.delete('application', applicationId)

      Promise.all([promiseDeleteStripe, promiseDeleteDynDB]).then(() => {
        resolve()
      }).catch((err) => {
        if (err.message === `No such customer: ${applicationId}`) {
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }

  removeUser (userId, deleteOrphanApplication = false) {
    const _path = `${path} removeUser`
    logger.info(`${_path} ${userId} ${deleteOrphanApplication}`)

    return new Promise((resolve, reject) => {
      this.getByUserId(userId).then((items) => {
        if (items.length === 0) return resolve()

        let promises = []

        for (let itemIndex in items) {
          let item = items[itemIndex]
          let users = item.users
          let indexes = []
          let lastIndex = -1

          while (users.indexOf(userId, (lastIndex + 1)) >= 0) {
            lastIndex = users.indexOf(userId, (lastIndex + 1))
            indexes.push(lastIndex)
          }

          if (users.length === indexes.length && deleteOrphanApplication === true) {
            let promise = this.delete(item.id)
            promises.push(promise)
          }

          let promise = this.dyndbService
            .listRemoveByIndex('application', item.id, 'users', indexes)
          promises.push(promise)
        }

        Promise.all(promises).then(() => {
          resolve()
        }).catch((err) => {
          reject(err)
        })

        return resolve()
      }).catch((err) => {
        if (err.name === 'NotFound') {
          return resolve()
        } else {
          return reject(err)
        }
      })
    })
  }

  getByUserId (userId) {
    const _path = `${path} getByUserId`
    logger.info(`${_path} ${userId}`)

    return new Promise((resolve, reject) => {
      this.dyndbService.getByUserId('application', { id: userId }).then((applicationInfo) => {
        logger.info(`${_path} result of this.dyndbService.getByUserId then`)

        if (applicationInfo.Count > 0) {
          return resolve(applicationInfo.Items)
        } else {
          return reject(ErrorHandler.typeError('NotFound', 'Applications do not exist.'))
        }
      }).catch((err) => {
        logger.warn(`${_path} result of getByUserId catch`, err.name)
        return reject(err)
      })
    })
  }

  updateCreditCard (parameters) {
    const _path = `${path} getCreditCard`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripeService.updateCreditCard({
        customerId: parameters.applicationId,
        token: parameters.token
      }).then(() => {
        logger.info(`${_path} result of this.stripeService.updateCreditCard then`)

        this.stripeService.retrieveToken(parameters.token).then((tokenResult) => {
          logger.info(`${_path} result of this.stripeService.retrieveToken catch`)

          const item = {
            card: {
              brand: tokenResult.card.brand,
              last4: tokenResult.card.last4,
              exp_month: tokenResult.card.exp_month,
              exp_year: tokenResult.card.exp_year
            }
          }

          this.dyndbService.update('application', parameters.applicationId, item).then(() => {
            logger.info(`${_path} result of this.dyndbService.update then`)
            return resolve(item.card)
          }).catch((err) => {
            logger.warn(`${_path} result of this.dyndbService.update catch`, err.name)
            return reject(err)
          })
        }).catch((err) => {
          logger.warn(`${_path} result of this.stripeService.retrieveToken catch`, err.name)
          return reject(err)
        })
      }).catch((err) => {
        logger.warn(`${_path} result of this.stripeService.updateCreditCard catch`, err.name)
        return reject(err)
      })
    })
  }

  subscriptionResponseHandler (subscription) {
    return {
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      trial_start: subscription.trial_start,
      trial_end: subscription.trial_end,
      plan: {
        id: subscription.plan.id,
        interval: subscription.plan.interval,
        upcoming: subscription.plan.upcoming || null
      }
    }
  }

  updateSubscription (parameters) {
    const _path = `${path} updateSubscription`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripeService.get(parameters.applicationId).then((customer) => {
        logger.info(`${_path} result of this.stripeService.get then`)

        const subscriptionId = customer.subscriptions.data[0].id

        this.stripeService.updateSubscription({
          id: subscriptionId,
          planId: parameters.planId
        }).then((subscription) => {
          logger.info(`${_path} result of this.stripe.updateSubscription then`)
          const subscriptionResponseHandled = this.subscriptionResponseHandler(subscription)

          this.dyndbService.update('application', parameters.applicationId, {
            subscription: subscriptionResponseHandled
          }).then(() => {
            logger.info(`${_path} result of this.dyndbService.update then`)
            return resolve(subscriptionResponseHandled)
          }).catch((err) => {
            logger.warn(`${_path} result of this.dyndbService.update catch`, err.name)
            return reject(err)
          })
        }).catch((err) => {
          logger.warn(`${_path} result of this.stripe.updateSubscription catch`, err.name)
          return reject(err)
        })
      }).catch((err) => {
        logger.warn(`${_path} result of this.stripeService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  upcomingSubscriptionCost (parameters) {
    const _path = `${path} updateSubscription`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripeService.get(parameters.applicationId).then((customer) => {
        logger.info(`${_path} result of this.stripeService.get then`)

        const subscriptionId = customer.subscriptions.data[0].id
        const prorationDate = Math.floor(Date.now() / 1000)

        this.stripeService.retrieveUpcomingInvoices({
          customerId: parameters.applicationId,
          subscriptionId: subscriptionId,
          planId: parameters.planId,
          prorationDate: prorationDate
        }).then((invoices) => {
          logger.info(`${_path} result of this.stripe.retrieveUpcomingInvoices then`)

          // Calculate the proration cost:
          let currentProrations = []
          let cost = 0
          for (let i = 0; i < invoices.lines.data.length; i++) {
            var invoiceItem = invoices.lines.data[i]
            if (invoiceItem.period.start === prorationDate) {
              currentProrations.push(invoiceItem)
              cost += invoiceItem.amount
            }
          }

          resolve((cost / 100))
        }).catch((err) => {
          logger.warn(`${_path} result of this.stripe.retrieveUpcomingInvoices catch`, err.name)
          return reject(err)
        })
      }).catch((err) => {
        logger.warn(`${_path} result of this.stripeService.get catch`, err.name)
        return reject(err)
      })
    })
  }

}
