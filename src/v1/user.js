import express from 'express'

const router = express.Router()

export default ({ auth, db }) => {
  /* Generate Stormpath's Register URL */
  router.get('/profile', (req, res) => {
    auth.tokens.getInfo(req.jwtToken, function (err, userInfo) {
      if (err) throw err
      res.status(200).send({
        id: req.user.sub,
        email: req.user.email,
        email_verified: req.user.email_verified
      })
    })
  })
  return router
}
