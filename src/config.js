const config = {
  'port': process.env.PORT || 3000,
  'bodyLimit': '100kb',
  'corsHeaders': ['Link'],
  'awsRegion': process.env.AWS_REGION || 'eu-central-1',
  'dynamodbPrefix': process.env.DYNAMODB_PREFIX || 'rp_dev_',
  'jwtSecret': process.env.JWT_SECRET || 'shared',
  'auth0Domain': process.env.AUTH0_DOMAIN || 'keepat.eu.auth0.com',
  'auth0Token': process.env.AUTH0_TOKEN || '',
  'stripeSecretKey': process.env.STRIPE_SECRET_KEY || '',
  'defaultPlanId': 'personal',
  'loggerLevel': process.env.LOGGER_LEVEL || 'verbose',
  'redisHost': process.env.REDIS_HOST || '127.0.0.1',
  'redisPort': process.env.REDIS_PORT || '6379',
  'plans': [
    { id: 'personal', name: 'Personal', price: 0 },
    { id: 'professional', name: 'Professional', price: 4.99 },
    { id: 'enterprise', name: 'Enterprise', price: 9.99 },
    { id: 'extreme', name: 'Extreme', price: 19.9 }
  ]
}

export default config
