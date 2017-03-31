import Promise from 'es6-promise'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from './dyndb.service'
import StripeService from './stripe.service'
import config from '../config'

const logger = LoggerHandler
const path = 'application-billing.service'

export default class ApplicationBillingService {

  constructor (applicationService) {
    this.dyndbService = new DynDBService()
    this.stripeService = new StripeService()
    this.applicationService = applicationService
  }

  getPlans () {
    const _path = `${path} getPlans`
    logger.info(`${_path}`)

    return new Promise((resolve) => {
      return resolve(config.plans)
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
        return this.stripeService.retrieveToken(parameters.token)
      }).then((tokenResult) => {
        logger.info(`${_path} result of this.stripeService.retrieveToken catch`)

        const item = {
          card: {
            brand: tokenResult.card.brand,
            last4: tokenResult.card.last4,
            exp_month: tokenResult.card.exp_month,
            exp_year: tokenResult.card.exp_year
          }
        }

        return this.dyndbService.update('application', parameters.applicationId, item)
      }).then((item) => {
        logger.info(`${_path} result of this.dyndbService.update then`)
        return resolve(item.card)
      }).catch((err) => {
        logger.warn(`${_path} result of promise chain catch`, err.name)
        return reject(err)
      })
    })
  }

  createToken (parameters) {
    const _path = `${path} createToken`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripeService.createToken(parameters).then((tokenResult) => {
        logger.info(`${_path} result of this.stripeService.createToken then`)
        return resolve(tokenResult)
      }).catch((err) => {
        logger.warn(`${_path} result of this.stripeService.createToken catch`, err.name)
        return reject(err)
      })
    })
  }

  subscriptionResponseHandler (subscription) {
    return {
      id: subscription.id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      trial_start: subscription.trial_start,
      trial_end: subscription.trial_end,
      plan: {
        id: subscription.plan.id,
        interval: subscription.plan.interval,
        upcomingPlanId: subscription.plan.upcomingPlanId || null
      }
    }
  }

  deleteSubscription (parameters) {
    const _path = `${path} deleteSubscription`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      return this.stripeService.delSubscription({
        id: parameters.id,
        at_period_end: parameters.at_period_end || false
      }).then((subscription) => {
        logger.info(`${_path} result of this.stripe.delSubscription then`)

        if (parameters.at_period_end === true && parameters.upcomingPlanId) {
          subscription.plan.upcomingPlanId = parameters.upcomingPlanId
        }

        return this.dyndbService.update('application', parameters.applicationId, {
          subscription: this.subscriptionResponseHandler(subscription)
        })
      }).then((item) => {
        logger.info(`${_path} result of this.dyndbService.update then`)
        return resolve(this.subscriptionResponseHandler(item.subscription))
      }).catch((err) => {
        logger.warn(`${_path} result of promise chain catch`, err.name)
        return reject(err)
      })
    })
  }

  updateSubscription (parameters) {
    const _path = `${path} updateSubscription`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripeService.updateSubscription({
        id: parameters.id,
        planId: parameters.planId
      }).then((subscription) => {
        logger.info(`${_path} result of this.stripe.updateSubscription then`)
        return this.dyndbService.update('application', parameters.applicationId, {
          subscription: this.subscriptionResponseHandler(subscription)
        })
      }).then((item) => {
        logger.info(`${_path} result of this.dyndbService.update then`)
        return resolve(this.subscriptionResponseHandler(item.subscription))
      }).catch((err) => {
        logger.warn(`${_path} result of promise chain catch`, err.name)
        return reject(err)
      })
    })
  }

  createSubscription (parameters) {
    const _path = `${path} createSubscription`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      return this.stripeService.createSubscription({
        customerId: parameters.applicationId,
        planId: parameters.planId
      }).then((subscription) => {
        logger.info(`${_path} result of this.stripe.createSubscription then`)
        return this.dyndbService.update('application', parameters.applicationId, {
          subscription: this.subscriptionResponseHandler(subscription)
        })
      }).then((item) => {
        logger.info(`${_path} result of this.dyndbService.update then`)
        return resolve(this.subscriptionResponseHandler(item.subscription))
      }).catch((err) => {
        logger.warn(`${_path} result of promise chain catch`, err.name)
        return reject(err)
      })
    })
  }

  upcomingSubscriptionCost (parameters) {
    const _path = `${path} upcomingSubscriptionCost`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const prorationDate = Math.floor(Date.now() / 1000)
      this.stripeService.get(parameters.applicationId).then((customer) => {
        logger.info(`${_path} result of this.stripeService.get then`)

        const subscriptionId = customer.subscriptions.data[0].id

        return this.stripeService.retrieveUpcomingInvoices({
          customerId: parameters.applicationId,
          subscriptionId: subscriptionId,
          planId: parameters.planId,
          prorationDate: prorationDate
        })
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
        logger.warn(`${_path} result of promise chain catch`, err.name)
        return reject(err)
      })
    })
  }

}
