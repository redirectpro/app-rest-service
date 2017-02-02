import * as auth0 from 'auth0'
import stripe from 'stripe'
import config from '../config'

let connections = {}

connections.stripe = stripe(config.stripeSecretKey)

// auth0 clients
connections.authClient = new auth0.AuthenticationClient({
  domain: config.auth0Domain
})

connections.authManage = new auth0.ManagementClient({
  domain: config.auth0Domain,
  token: config.auth0Token
})

export default connections
