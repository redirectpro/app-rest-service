exports.parseAuthorization = (req, res, next) => {
  if (req['headers']['authorization']) {
    req.jwtToken = req['headers']['authorization'].substr(7)
  }
  next()
}

exports.parseUserId = (req, res, next) => {
  // object key will be _id to identify that is not from JWT
  if (req['user'] && req['user']['sub'] && req['user']['sub']) {
    req.user._id = req['user']['sub']
    if (req.user._id.indexOf('|') >= 0) {
      req.user._id = req.user._id.split('|')[1]
    }
  }
  next()
}
