import express from 'express'
import errorHandler from '../handlers/errorHandler'
import * as auth0 from 'auth0'
import stripe from 'stripe'
import config from '../config'

export default ({ db }) => {
  const router = express.Router()
  const stripeClient = stripe(config.stripeSecretKey)

  // auth0
  const authClient = new auth0.AuthenticationClient({
    domain: config.auth0Domain
  })

  const authManage = new auth0.ManagementClient({
    domain: config.auth0Domain,
    token: config.auth0Token
  })

  /* Generate Stormpath's Register URL */
  router.get('/profile', (req, res) => {
    authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
      if (err) return errorHandler(err, req, res)

      let appMetadata = {}

      const responseHandler = (userInfo) => {
        res.status(200).send({
          id: userInfo.user_id,
          email: userInfo.email,
          email_verified: userInfo.email_verified,
          stripe: userInfo.app_metadata.stripe
        })
      }

      if (userInfo.hasOwnProperty('app_metadata')) appMetadata = userInfo.app_metadata
      if (!appMetadata.hasOwnProperty('stripe')) {
        appMetadata.stripe = {
          customer_id: null
        }
      }
      if (!appMetadata.stripe.customer_id) {
        stripeClient.customers.create({ email: userInfo.email }, (err, customer) => {
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
      } else {
        responseHandler(userInfo)
      }
    })
  })

  router.put('/creditCard', (req, res) => {
    authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
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
            res.status(200).send(appMetadata.stripe.card)
          })
        })
      })
    })
  })

  router.put('/plan', (req, res) => {
    authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
      if (err) return errorHandler(err, req, res)

      if (!userInfo.stripe.card) {
        const error = {
          message: 'Please add a card to your account before choosing a plan.'
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
            userInfo.app_metadata = appMetadata
            res.status(200).send({
              current_period_start: subscription.current_period_end,
              current_period_end: subscription.current_period_end,
              trial_start: subscription.trial_start,
              trial_end: subscription.trial_end,
              status: subscription.status,
              plan: {
                id: subscription.plan.id,
                name: subscription.plan.name
              }
            })
          })
        }
      )
    })
  })

  return router
}
