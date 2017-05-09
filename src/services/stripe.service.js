import Promise from 'es6-promise'
import LoggerHandler from '../handlers/logger.handler'
import ErrorHandler from '../handlers/error.handler'

/*
 * Since we don't have any application management platform, stripe
 * will be our platform managment, thus our stripe's customerId will
 * be our applicationId and from now on, the email field will be our
 * billing email
 */
export default class StripeService {

  constructor () {
    this.path = 'stripe.service'
    this.logger = new LoggerHandler()
    this.stripe = global.conn.stripe
    this.logger.info(`${this.path} constructor`)
  }

  get (customerId) {
    const _path = `${this.path} get ${customerId}`
    this.logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.stripe.customers.retrieve(customerId).then((customer) => {
        this.logger.info(`${_path} result of get then`)

        if (customer.subscriptions.total_count === 0) {
          return reject(ErrorHandler.typeError('SubscriptionNotFound', 'Subscription not found.'))
        }

        if (customer.subscriptions.total_count > 1) {
          return reject(ErrorHandler.typeError('MultipleSubscriptions', 'I can\'t handle multiples subscriptions.'))
        }

        return resolve(customer)
      }).catch((err) => {
        this.logger.warn(`${_path} result of get catch`, err.name)
        reject(err)
      })
    })
  }

  /* create method automatically add subscription on free plan */
  create (parameters) {
    const _path = `${this.path} create`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      /* STEP 1 - Create customer */
      this.stripe.customers.create({
        email: parameters.userEmail
      }).then((customer) => {
        this.logger.info(`${_path} result of create then`)

        /* STEP 2 - Create Subscription on free plan */
        this.createSubscription({
          customerId: customer.id,
          planId: parameters.planId
        }).then((subscription) => {
          customer.subscriptions.total_count += 1
          customer.subscriptions.data.push(subscription)
          return resolve(customer)
        }).catch((err) => {
          this.logger.warn(`${_path} result of create catch`, err.name)
          return reject(err)
        })
      }).catch((err) => {
        this.logger.warn(`${_path} result of get catch`, err.name)
        reject(err)
      })
    })
  }

  delete (customerId) {
    const _path = `${this.path} delete ${customerId}`
    this.logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.stripe.customers.del(customerId).then((confirmation) => {
        this.logger.info(`${_path} result of delete then`)
        return resolve(confirmation)
      }).catch((err) => {
        this.logger.warn(`${_path} result of delete catch`, err.name)
        reject(err)
      })
    })
  }

  createSubscription (parameters) {
    const _path = `${this.path} createSubscription`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.subscriptions.create({
        customer: parameters.customerId,
        plan: parameters.planId
      }).then((subscription) => {
        this.logger.info(`${_path} result of createSubscription then`)
        return resolve(subscription)
      }).catch((err) => {
        this.logger.warn(`${_path} result of createSubscription catch`, err.name)
        reject(err)
      })
    })
  }

  updateSubscription (parameters) {
    const _path = `${this.path} updateSubscription`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.subscriptions.update(parameters.id, {
        plan: parameters.planId
      }).then((subscription) => {
        this.logger.info(`${_path} result of updateSubscription then`)
        return resolve(subscription)
      }).catch((err) => {
        this.logger.warn(`${_path} result of updateSubscription catch`, err.name)
        reject(err)
      })
    })
  }

  delSubscription (parameters) {
    const _path = `${this.path} delSubscription`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.subscriptions.del(parameters.id, {
        at_period_end: parameters.at_period_end
      }).then((subscription) => {
        this.logger.info(`${_path} result of delSubscription then`)
        return resolve(subscription)
      }).catch((err) => {
        this.logger.warn(`${_path} result of delSubscription catch`, err.name)
        reject(err)
      })
    })
  }

  retrieveToken (token) {
    const _path = `${this.path} retrieveToken`
    this.logger.info(`${_path} ${token}`)

    return new Promise((resolve, reject) => {
      this.stripe.tokens.retrieve(token).then((resultToken) => {
        this.logger.info(`${_path} result of retrieveToken then`)
        return resolve(resultToken)
      }).catch((err) => {
        this.logger.warn(`${_path} result of retrieveToken catch`, err.name)
        reject(err)
      })
    })
  }

  createToken (parameters) {
    const _path = `${this.path} createToken`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.tokens.create(parameters).then((tokenResult) => {
        this.logger.info(`${_path} result of createToken then`)
        return resolve(tokenResult)
      }).catch((err) => {
        this.logger.warn(`${_path} result of createToken catch`, err.name)
        reject(err)
      })
    })
  }

  updateCreditCard (parameters) {
    const _path = `${this.path} updateCreditCard`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.customers.update(parameters.customerId, {
        card: parameters.token
      }).then((customer) => {
        this.logger.info(`${_path} result of updateCreditCard then`)
        return resolve(customer)
      }).catch((err) => {
        this.logger.warn(`${_path} result of updateCreditCard catch`, err.name)
        reject(err)
      })
    })
  }

  retrieveUpcomingInvoices (parameters) {
    const _path = `${this.path} retrieveUpcoming`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.invoices.retrieveUpcoming(
        parameters.customerId,
        parameters.subscriptionId,
        {
          subscription_plan: parameters.planId,
          subscription_proration_date: parameters.prorationDate
        }).then((invoices) => {
          this.logger.info(`${_path} result of retrieveUpcomingInvoices then`)
          return resolve(invoices)
        }).catch((err) => {
          this.logger.warn(`${_path} result of retrieveUpcomingInvoices catch`, err.name)
          reject(err)
        })
    })
  }

  retrieveEvent (eventId) {
    const _path = `${this.path} retrieveEvent ${eventId}`
    this.logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.stripe.events.retrieve(eventId).then((event) => {
        this.logger.info(`${_path} result of retrieveEvent then`)
        return resolve(event)
      }).catch((err) => {
        this.logger.warn(`${_path} result of retrieveEvent catch`, err.name)
        reject(err)
      })
    })
  }
}
