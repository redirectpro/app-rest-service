import express from 'express'
import * as userCallback from './user.callback'

export default () => {
  const router = express.Router()

  router.get('/user/profile', userCallback.getProfile)

  return router
}
