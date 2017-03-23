// import express from 'express'
// import ErrorHandler from '../handlers/error.handler'
// import UserService from './user.service'
// const conn = global.conn
//
// export default () => {
//   const router = express.Router()
//
//   router.put('/creditCard', (req, res) => {
//     const responseHandler = (userInfo) => {
//       res.status(200).send({
//         last4: userInfo.app_metadata.stripe.card.last4,
//         brand: userInfo.app_metadata.stripe.card.brand,
//         exp_month: userInfo.app_metadata.stripe.card.exp_month,
//         exp_year: userInfo.app_metadata.stripe.card.exp_year
//       })
//     }
//
//     conn.authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
//       err = ErrorHandler.makeSureErrorIsNull(err, userInfo)
//       if (err) return ErrorHandler.responseError(err, req, res)
//
//       conn.stripe.tokens.retrieve(req.body.token, (err, customer) => {
//         if (err) return ErrorHandler.responseError(err, req, res)
//
//         conn.stripe.customers.update(userInfo.app_metadata.stripe.customer_id, {
//           card: req.body.token
//         }, (err) => {
//           if (err) return ErrorHandler.responseError(err, req, res)
//
//           let appMetadata = userInfo.app_metadata
//
//           appMetadata.stripe.card = {
//             last4: customer.card.last4,
//             brand: customer.card.brand,
//             exp_month: customer.card.exp_month,
//             exp_year: customer.card.exp_year
//           }
//
//           conn.authManage.users.updateAppMetadata({
//             id: userInfo.user_id
//           }, appMetadata).then(() => {
//             userInfo.app_metadata = appMetadata
//             responseHandler(userInfo)
//           })
//         })
//       })
//     })
//   })
//
//   router.put('/plan', (req, res) => {
//     const responseHandler = (subscription) => {
//       res.status(200).send({
//         current_period_start: subscription.current_period_start,
//         current_period_end: subscription.current_period_end,
//         trial_start: subscription.trial_start,
//         trial_end: subscription.trial_end,
//         status: subscription.status,
//         plan: {
//           id: subscription.plan.id,
//           name: subscription.plan.name
//         }
//       })
//     }
//
//     conn.authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
//       let error; let card
//       err = ErrorHandler.makeSureErrorIsNull(err, userInfo)
//       if (err) return ErrorHandler.responseError(err, req, res)
//
//       card = userInfo.app_metadata.stripe.card
//       if (!card || (card && !card.last4)) {
//         error = {
//           message: 'Please add a card to your account before choosing a plan.'
//         }
//         return ErrorHandler.responseError(error, req, res)
//       }
//
//       if (userInfo.app_metadata.stripe.plan_id &&
//         userInfo.app_metadata.stripe.plan_id === req.body.plan_id) {
//         error = {
//           message: 'The selected plan is the same as the current plan.'
//         }
//         return ErrorHandler.responseError(error, req, res)
//       }
//
//       if (!req.body.plan_id) {
//         error = {
//           message: 'You must inform a plan.'
//         }
//         return ErrorHandler.responseError(error, req, res)
//       }
//
//       // update subscription
//       conn.stripe.customers.updateSubscription(
//         userInfo.app_metadata.stripe.customer_id,
//         userInfo.app_metadata.stripe.subscription_id,
//         { plan: req.body.plan_id },
//         (err, subscription) => {
//           if (err) return ErrorHandler.responseError(err, req, res)
//
//           let appMetadata = userInfo.app_metadata
//
//           appMetadata.stripe.plan_id = subscription.plan.id
//
//           conn.authManage.users.updateAppMetadata({
//             id: userInfo.user_id
//           }, appMetadata).then(() => {
//             responseHandler(subscription)
//           })
//         }
//       )
//     })
//   })
//
//   router.post('/planUpcomingCost', (req, res) => {
//     conn.authClient.tokens.getInfo(req.jwtToken, (err, userInfo) => {
//       let error
//       err = ErrorHandler.makeSureErrorIsNull(err, userInfo)
//       if (err) return ErrorHandler.responseError(err, req, res)
//       const prorationDate = Math.floor(Date.now() / 1000)
//
//       if (!req.body.plan_id) {
//         error = {
//           message: 'You must inform a plan.'
//         }
//         return ErrorHandler.responseError(error, req, res)
//       }
//
//       conn.stripe.invoices.retrieveUpcoming(
//         userInfo.app_metadata.stripe.customer_id,
//         userInfo.app_metadata.stripe.subscription_id,
//         {
//           subscription_plan: req.body.plan_id,
//           subscription_proration_date: prorationDate
//         },
//         (err, invoice) => {
//           console.log(err)
//           console.log(invoice)
//
//           if (err) return ErrorHandler.responseError(err, req, res)
//
//           // Calculate the proration cost:
//           var currentProrations = []
//           var cost = 0
//           for (var i = 0; i < invoice.lines.data.length; i++) {
//             var invoiceItem = invoice.lines.data[i]
//             if (invoiceItem.period.start === prorationDate) {
//               currentProrations.push(invoiceItem)
//               cost += invoiceItem.amount
//             }
//           }
//
//           res.status(200).send({
//             cost: (cost / 100)
//           })
//         }
//       )
//     })
//   })
//
//   return router
// }
