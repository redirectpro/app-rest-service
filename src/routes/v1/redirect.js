import express from 'express'
import { getApplicationId, getRedirectId } from '../../middlewares/params.callback'
import * as redirectCallback from './redirect.callback'

export default () => {
  const router = express.Router()

  router.get('/:applicationId/redirects', getApplicationId, redirectCallback.getList)
  router.post('/:applicationId/redirect', getApplicationId, redirectCallback.post)
  router.get('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, redirectCallback.get)
  router.delete('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, redirectCallback.delete)
  router.put('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, redirectCallback.put)
  router.post('/:applicationId/redirect/:redirectId/fromTo', getApplicationId, getRedirectId, redirectCallback.postFromTo)
  router.get('/:applicationId/redirect/:redirectId/fromTo', getApplicationId, getRedirectId, redirectCallback.getFromTo)
  router.get('/:applicationId/redirect/:redirectId/job/:queue(\\w+)/:jobId(\\d+)', getApplicationId, getRedirectId, redirectCallback.getJob)

  return router
}
