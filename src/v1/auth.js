import express from 'express'
import stormpath from 'stormpath'
import config from '../config.js'

const router = express.Router()
const stormpathClient = new stormpath.Client()
let stormpathApplication

stormpathClient.getApplication(config.stormpathApplicationHref, (err, application) => {
  if (err) return console.error(err)
  stormpathApplication = application
  console.log('Application OK')
})

export default ({config, db}) => {
  /* Generate Stormpath's Register URL */
  router.get('/register', (req, res) => {
    var url = stormpathApplication.createIdSiteUrl({
      path: '/#/register',
      callbackUri: req.query.callbackUrl || '/#/'
    })

    res.status(200).send({ redirectUrl: url })
  })

  /* Generate Stormpath's Login URL */
  router.get('/login', (req, res) => {
    let url = stormpathApplication.createIdSiteUrl({
      path: '/#/',
      callbackUri: req.query.callbackUrl || '/#/'
    })

    res.status(200).send({ redirectUrl: url })
  })

  /* Generate Stormpath's Logout URL */
  router.get('/logout', (req, res) => {
    let url = stormpathApplication.createIdSiteUrl({
      logout: true,
      callbackUri: req.query.callbackUrl || '/#/'
    })

    res.status(200).send({ redirectUrl: url })
  })

  router.get('/idSiteResult', (req, res) => {
    if (!req.query.jwtResponse) {
      res.status(400).send({
        'ERRO': '!!!!'
      })
    }
    // console.log(req.url)
    stormpathApplication.handleIdSiteCallback(req.url, (err, idSiteResult) => {
      if (err) throw err

      let authenticator = new stormpath.OAuthAuthenticator(stormpathApplication)

      let authParams = {
        body: {
          grant_type: 'stormpath_token',
          stormpath_token: req.query.jwtResponse
        }
      }

      authenticator.authenticate(authParams, (err, result) => {
        if (err) {
          res.status(400).send({
            status: err.status,
            message: err.userMessage
          })
        } else {
          delete result.accessTokenResponse.stormpath_access_token_href
          res.status(200).send(result.accessTokenResponse)
        }
      })
    })
  })

  return router
}
