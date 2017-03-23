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

  /* create method automatically add subscription on free plan */
  create (parameters) {
    const _path = `${path} create`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      /* STEP 1 - Create customer */
      global.conn.stripe.customers.create({
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
          logger.error(`${_path} result of create catch`, err.name)
          reject(err)
        })
      })
    })
  }

  createSubscription (parameters) {
    const _path = `${path} createSubscription`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      global.conn.stripe.subscriptions.create({
        customer: parameters.customerId,
        plan: parameters.planId
      }, (err, subscription) => {
        if (err) reject(err)
        resolve(subscription)
      })
    })
  }
}
