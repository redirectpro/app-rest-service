import stripe from 'stripe'
import config from '../config'
import LoggerHandler from '../handlers/logger.handler'
import Queue from 'bull'
import aws from 'aws-sdk'
aws.config.update({ 'region': config.awsRegion })
const logger = LoggerHandler

if (!global.conn) {
  global.conn = {}
}

// bull server
if (!global.conn.bull) {
  global.conn.bull = {
    fileConverter: Queue('fileConverter', config.redisPort, config.redisHost)
  }
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

export default global.conn
