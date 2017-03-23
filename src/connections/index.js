import * as auth0 from 'auth0'
import stripe from 'stripe'
import config from '../config'
import LoggerHandler from '../handlers/logger.handler'
import aws from 'aws-sdk'
aws.config.update({ 'region': 'us-east-1' })

const logger = LoggerHandler

if (!global.conn) {
  global.conn = {}
}

// aws clients
if (!global.conn.dyndb) {
  global.conn.dyndb = new aws.DynamoDB.DocumentClient()
  logger.info('connected to aws dynamodb')
}

// stripe client
if (!global.conn.stripe) {
  global.conn.stripe = stripe(config.stripeSecretKey)
  logger.info('connected to stripe')
}

// auth0 clients
if (!global.conn.authClient) {
  global.conn.authClient = new auth0.AuthenticationClient({
    domain: config.auth0Domain
  })
  logger.info('connected to authClient')
}

if (!global.conn.authManage) {
  global.conn.authManage = new auth0.ManagementClient({
    domain: config.auth0Domain,
    token: config.auth0Token
  })
  logger.info('connected to authManage')
}

export default global.conn
