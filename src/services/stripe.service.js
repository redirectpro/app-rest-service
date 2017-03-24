import LoggerHandler from '../handlers/logger.handler'
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
    const _path = `${path} get`
    logger.info(`${_path} ${customerId}`)

    return new Promise((resolve, reject) => {
      this.stripe.retrieve(customerId, (err, customer) => {
        if (err) reject(err)
        resolve(customer)
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
      }, (err, customer) => {
        if (err) reject(err)

        /* STEP 2 - Create Subscription on free plan */
        this.createSubscription({
          customerId: customer.id,
          planId: parameters.planId
        }).then((subscription) => {
          customer.subscriptions.total_count += 1
          customer.subscriptions.data.push(subscription)
          resolve(customer)
        }).catch((err) => {
          logger.warn(`${_path} result of create catch`, err.name)
          reject(err)
        })
      })
    })
  }

  delete (customerId) {
    const _path = `${path} delete`
    logger.info(`${_path} ${customerId}`)

    return new Promise((resolve, reject) => {
      this.stripe.customers.del(customerId, (err, confirmation) => {
        if (err) reject(err)
        resolve(confirmation)
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
      }, (err, subscription) => {
        if (err) reject(err)
        resolve(subscription)
      })
    })
  }

  retrieveToken (token) {
    const _path = `${path} retrieveToken`
    logger.info(`${_path} ${token}`)

    return new Promise((resolve, reject) => {
      this.stripe.tokens.retrieve(token, (err, resultToken) => {
        if (err) reject(err)
        resolve(resultToken)
      })
    })
  }

  updateCreditCard (parameters) {
    const _path = `${path} updateCreditCard`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripe.customer.update(parameters.customerId, {
        card: parameters.token
      }, (err, customer) => {
        if (err) reject(err)
        resolve(customer)
      })
    })
  }

}
