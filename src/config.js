let config = {
  'port': process.env.PORT || 3000,
  'bodyLimit': '100kb',
  'corsHeaders': ['Link'],
  'jwtSecret': process.env.JWT_SECRET || 'shared',
  'auth0Domain': process.env.AUTH0_DOMAIN || 'keepat.eu.auth0.com',
  'auth0Token': process.env.AUTH0_TOKEN || '',
  'stripeSecretKey': process.env.STRIPE_SECRET_KEY || '',
  'defaultPlanId': 'personal',
  'loggerLevel': process.env.LOGGER_LEVEL || 'verbose'
}

export default config
