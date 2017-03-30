import Promise from 'es6-promise'
import LoggerHandler from '../handlers/logger.handler'
import ErrorHandler from '../handlers/error.handler'
const logger = LoggerHandler
const path = 'stripe.service'

/*
 * Since we don't have any application management platform, stripe
 * will be our platform managment, thus our stripe's customerId will
 * be our applicationId and from now on, the email field will be our
 * billing email
 */
export default class StripeService {

  constructor () {
    this.stripe = global.conn.stripe
  }

  get (customerId) {
    const _path = `${path} get ${customerId}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.stripe.customers.retrieve(customerId).then((customer) => {
        logger.info(`${_path} result of get then`)

        if (customer.subscriptions.total_count === 0) {
          return reject(ErrorHandler.typeError('SubscriptionNotFound', 'Subscription not found.'))
        }

        if (customer.subscriptions.total_count > 1) {
          return reject(ErrorHandler.typeError('MultipleSubscriptions', 'I can\'t handle multiples subscriptions.'))
        }

        return resolve(customer)
      }).catch((err) => {
        logger.warn(`${_path} result of get catch`, err.name)
        reject(err)
      })
    })
  }

  /* create method automatically add subscription on free plan */
  create (parameters) {
    const _path = `${path} create`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      /* STEP 1 - Create customer */
      this.stripe.customers.create({
        email: parameters.userEmail
      }).then((customer) => {
        logger.info(`${_path} result of create then`)

        /* STEP 2 - Create Subscription on free plan */
        this.createSubscription({
          customerId: customer.id,
          planId: parameters.planId
        }).then((subscription) => {
          customer.subscriptions.total_count += 1
          customer.subscriptions.data.push(subscription)
          return resolve(customer)
        }).catch((err) => {
          logger.warn(`${_path} result of create catch`, err.name)
          return reject(err)
        })
      }).catch((err) => {
        logger.warn(`${_path} result of get catch`, err.name)
        reject(err)
      })
    })
  }

  delete (customerId) {
    const _path = `${path} delete ${customerId}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.stripe.customers.del(customerId).then((confirmation) => {
        logger.info(`${_path} result of delete then`)
        return resolve(confirmation)
      }).catch((err) => {
        logger.warn(`${_path} result of delete catch`, err.name)
        reject(err)
      })
    })
  }

  createSubscription (parameters) {
    const _path = `${path} createSubscription`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.subscriptions.create({
        customer: parameters.customerId,
        plan: parameters.planId
      }).then((subscription) => {
        logger.info(`${_path} result of createSubscription then`)
        return resolve(subscription)
      }).catch((err) => {
        logger.warn(`${_path} result of createSubscription catch`, err.name)
        reject(err)
      })
    })
  }

  updateSubscription (parameters) {
    const _path = `${path} updateSubscription`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.subscriptions.update(parameters.id, {
        plan: parameters.planId
      }).then((subscription) => {
        logger.info(`${_path} result of updateSubscription then`)
        return resolve(subscription)
      }).catch((err) => {
        logger.warn(`${_path} result of createSubscription catch`, err.name)
        reject(err)
      })
    })
  }

  retrieveToken (token) {
    const _path = `${path} retrieveToken`
    logger.info(`${_path} ${token}`)

    return new Promise((resolve, reject) => {
      this.stripe.tokens.retrieve(token).then((resultToken) => {
        logger.info(`${_path} result of retrieveToken then`)
        return resolve(resultToken)
      }).catch((err) => {
        logger.warn(`${_path} result of retrieveToken catch`, err.name)
        reject(err)
      })
    })
  }

  createToken (parameters) {
    const _path = `${path} createToken`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.tokens.create(parameters).then((tokenResult) => {
        logger.info(`${_path} result of createToken then`)
        return resolve(tokenResult)
      }).catch((err) => {
        logger.warn(`${_path} result of createToken catch`, err.name)
        reject(err)
      })
    })
  }

  updateCreditCard (parameters) {
    const _path = `${path} updateCreditCard`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.customers.update(parameters.customerId, {
        card: parameters.token
      }).then((customer) => {
        logger.info(`${_path} result of updateCreditCard then`)
        return resolve(customer)
      }).catch((err) => {
        logger.warn(`${_path} result of updateCreditCard catch`, err.name)
        reject(err)
      })
    })
  }

  retrieveUpcomingInvoices (parameters) {
    const _path = `${path} retrieveUpcoming`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.invoices.retrieveUpcoming(
        parameters.customerId,
        parameters.subscriptionId,
        {
          subscription_plan: parameters.planId,
          subscription_proration_date: parameters.prorationDate
        }).then((invoices) => {
          logger.info(`${_path} result of retrieveUpcomingInvoices then`)
          return resolve(invoices)
        }).catch((err) => {
          logger.warn(`${_path} result of retrieveUpcomingInvoices catch`, err.name)
          reject(err)
        })
    })
  }

  retrieveEvent (eventId) {
    const _path = `${path} retrieveEvent ${eventId}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.stripe.events.retrieve(eventId).then((event) => {
        logger.info(`${_path} result of retrieveEvent then`)
        return resolve(event)
      }).catch((err) => {
        logger.warn(`${_path} result of retrieveEvent catch`, err.name)
        reject(err)
      })
    })
  }
}
