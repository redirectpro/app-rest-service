import express from 'express'
import { getApplicationId, getRedirectId } from '../../middlewares/params.callback'
import * as redirectCallback from './redirect.callback'

export default () => {
  const router = express.Router()

  router.get('/:applicationId/redirects', getApplicationId, redirectCallback.getRedirects)
  router.post('/:applicationId/redirect', getApplicationId, redirectCallback.postRedirect)
  router.get('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, redirectCallback.getRedirect)
  router.delete('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, redirectCallback.deleteRedirect)
  router.put('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, redirectCallback.putRedirect)
  router.post('/:applicationId/redirect/:redirectId/fromTo', getApplicationId, getRedirectId, redirectCallback.postRedirectFromTo)
  router.get('/:applicationId/redirect/:redirectId/fromTo', getApplicationId, getRedirectId, redirectCallback.getRedirectFromTo)
  router.get('/:applicationId/redirect/:redirectId/job/:queue(\\w+)/:jobId(\\d+)', getApplicationId, getRedirectId, redirectCallback.getRedirectJob)

  return router
}
