let config = {
  'port': process.env.PORT || 3000,
  'bodyLimit': '100kb',
  'corsHeaders': ['Link'],
  'awsRegion': 'us-east-1',
  'jwtSecret': process.env.JWT_SECRET || 'shared',
  'auth0Domain': process.env.AUTH0_DOMAIN || 'keepat.eu.auth0.com',
  'auth0Token': process.env.AUTH0_TOKEN || '',
  'stripeSecretKey': process.env.STRIPE_SECRET_KEY || '',
  'defaultPlanId': 'personal',
  'loggerLevel': process.env.LOGGER_LEVEL || 'verbose',
  'plans': [
    { id: 'personal', name: 'Personal', price: 0 },
    { id: 'professional', name: 'Professional', price: 4.99 },
    { id: 'enterprise', name: 'Enterprise', price: 9.99 },
    { id: 'extreme', name: 'Extreme', price: 19.9 }
  ]
}

export default config
