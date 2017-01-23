let config = {
  'port': process.env.PORT || 3000,
  'bodyLimit': '100kb',
  'corsHeaders': ['Link'],
  'stormpathApplicationHref': process.env.STORMPATH_APPLICATION_HREF || 'https://api.stormpath.com/v1/applications/70XmTrfj9PqI1qCR6gr0Dc'
}

export default config
