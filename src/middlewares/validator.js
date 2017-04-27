import expressValidator from 'express-validator'
export default () => {
  return expressValidator({
    customValidators: {
      isArray: (value) => { return Array.isArray(value) },
      isHostName: (value) => {
        const pattern = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.){1,}([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/g
        let isValid = true
        if (Array.isArray(value) === true) {
          value.forEach((item) => {
            if (isValid === true) {
              isValid = (item.match(pattern) !== null)
            }
          })
        } else {
          isValid = (value.match(pattern) !== null)
        }
        return isValid
      }
    }
  })
}
