import express from 'express'
import { getApplicationId, getPlanId } from '../../middlewares/params.callback'
import * as billingCallback from './billing.callback'

export default () => {
  const router = express.Router()

  router.get('/billing/plans', billingCallback.getPlans)
  router.get('/:applicationId/billing/profile', getApplicationId, billingCallback.getProfile)
  router.put('/:applicationId/billing/creditCard/:token', getApplicationId, billingCallback.putCreditCard)
  router.put('/:applicationId/billing/plan/:planId', getApplicationId, getPlanId, billingCallback.putPlan)
  router.get('/:applicationId/billing/plan/:planId/upcoming', getApplicationId, getPlanId, billingCallback.getPlanUpcoming)
  router.post('/:applicationId/billing/cancelUpcomingPlan', getApplicationId, billingCallback.postCancelUpcomingPlan)

  return router
}
