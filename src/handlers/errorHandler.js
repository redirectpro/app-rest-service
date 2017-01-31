// error middleware
const errorHandler = (err, req, res, next) => {
  let status = 500

  if (err.name === 'UnauthorizedError') {
    status = 401
  }

  res.status(status).send({
    message: err.message
  })

  if (next) next()
}

export default errorHandler
