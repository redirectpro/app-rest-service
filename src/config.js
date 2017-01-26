let config = {
  'port': process.env.PORT || 3000,
  'bodyLimit': '100kb',
  'corsHeaders': ['Link'],
  'jwtSecret': process.env.JWT_SECRET || 'shared'
}

export default config
