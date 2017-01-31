import express from 'express'
import errorHandler from '../handlers/errorHandler'
import * as auth0 from 'auth0'
import stripe from 'stripe'
import config from '../config'

export default ({ db }) => {
  const router = express.Router()
  const stripeClient = stripe(config.stripeSecretKey)

  // auth0 clients
  const authClient = new auth0.AuthenticationClient({
    domain: config.auth0Domain
  })

  const authManage = new auth0.ManagementClient({
    domain: config.auth0Domain,
    token: config.auth0Token
  })

  const makeSureErrorIsNull = (err, content) => {
    if (!err && typeof (content) === 'string' && content === 'NotFound') {
      err = {
        name: 'UserNotFound',
        message: 'User not found.'
      }
    }

    return err
  }

  /* Generate Stormpath's Register URL */
  router.get('/profile', (req, res) => {
    const responseHandler = (userInfo) => {
      res.status(200).send({
        id: userInfo.user_id,
        email: userInfo.email,
        email_verified: userInfo.email_verified,
        stripe: userInfo.app_metadata.stripe
      })
    }

    authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
      err = makeSureErrorIsNull(err, userInfo)
      if (err) return errorHandler(err, req, res)
      let appMetadata = {}

      if (userInfo.app_metadata) {
        appMetadata = userInfo.app_metadata
      }

      if (!appMetadata.stripe) {
        appMetadata.stripe = { customer_id: null }
      }

      if (appMetadata.stripe.customer_id) {
        responseHandler(userInfo)
      } else {
        stripeClient.customers.create({
          email: userInfo.email
        }, (err, customer) => {
          if (err) return errorHandler(err, req, res)
          appMetadata.stripe.customer_id = customer.id
          appMetadata.stripe.plan_id = 'freemium'

          stripeClient.subscriptions.create({
            customer: customer.id,
            plan: appMetadata.stripe.plan_id
          }, (err, subscription) => {
            if (err) return errorHandler(err, req, res)
            appMetadata.stripe.subscription_id = subscription.id
            authManage.users.updateAppMetadata({
              id: userInfo.user_id
            }, appMetadata).then(() => {
              userInfo.app_metadata = appMetadata
              responseHandler(userInfo)
            })
          })
        })
      }
    })
  })

  router.put('/creditCard', (req, res) => {
    const responseHandler = (userInfo) => {
      res.status(200).send({
        last4: userInfo.app_metadata.stripe.card.last4,
        brand: userInfo.app_metadata.stripe.card.brand,
        exp_month: userInfo.app_metadata.stripe.card.exp_month,
        exp_year: userInfo.app_metadata.stripe.card.exp_year
      })
    }

    authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
      err = makeSureErrorIsNull(err, userInfo)
      if (err) return errorHandler(err, req, res)

      stripeClient.tokens.retrieve(req.body.token, (err, customer) => {
        if (err) return errorHandler(err, req, res)

        stripeClient.customers.update(userInfo.app_metadata.stripe.customer_id, {
          card: req.body.token
        }, (err, customerToken) => {
          if (err) return errorHandler(err, req, res)

          let appMetadata = userInfo.app_metadata

          appMetadata.stripe.card = {
            last4: customer.card.last4,
            brand: customer.card.brand,
            exp_month: customer.card.exp_month,
            exp_year: customer.card.exp_year
          }

          authManage.users.updateAppMetadata({
            id: userInfo.user_id
          }, appMetadata).then(() => {
            userInfo.app_metadata = appMetadata
            responseHandler(userInfo)
          })
        })
      })
    })
  })

  router.put('/plan', (req, res) => {
    const responseHandler = (subscription) => {
      res.status(200).send({
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
        status: subscription.status,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name
        }
      })
    }

    authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
      let error; let card
      err = makeSureErrorIsNull(err, userInfo)
      if (err) return errorHandler(err, req, res)

      card = userInfo.app_metadata.stripe.card
      if (!card || (card && !card.last4)) {
        error = {
          message: 'Please add a card to your account before choosing a plan.'
        }
        return errorHandler(error, req, res)
      }

      if (userInfo.app_metadata.stripe.plan_id &&
        userInfo.app_metadata.stripe.plan_id === req.body.plan_id) {
        error = {
          message: 'The selected plan is the same as the current plan.'
        }
        return errorHandler(error, req, res)
      }

      // update subscription
      stripeClient.customers.updateSubscription(
        userInfo.app_metadata.stripe.customer_id,
        userInfo.app_metadata.stripe.subscription_id,
        { plan: req.body.plan_id },
        (err, subscription) => {
          if (err) return errorHandler(err, req, res)

          let appMetadata = userInfo.app_metadata

          appMetadata.stripe.plan_id = subscription.plan.id

          authManage.users.updateAppMetadata({
            id: userInfo.user_id
          }, appMetadata).then(() => {
            responseHandler(subscription)
          })
        }
      )
    })
  })

  return router
}
