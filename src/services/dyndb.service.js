import Promise from 'es6-promise'
import conn from '../connections'
import LoggerHandler from '../handlers/logger.handler'
const logger = LoggerHandler
const path = 'dyndb.service'

export default class DynDBService {
  constructor () {
    this.dyndb = conn.dyndb
  }

  get (table, parameters) {
    const _path = `${path} get:${table}`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        scanIndexForward: false,
        ExpressionAttributeNames: { },
        ExpressionAttributeValues: { },
        KeyConditionExpression: '',
        Limit: 1
      }

      if (parameters.id) {
        queryParams.ExpressionAttributeNames['#id'] = 'id'
        queryParams.ExpressionAttributeValues[':id'] = parameters.id
        queryParams.KeyConditionExpression = '#id = :id'
      }

      if (parameters.applicationId) {
        queryParams.ExpressionAttributeNames['#applicationId'] = 'applicationId'
        queryParams.ExpressionAttributeValues[':applicationId'] = parameters.applicationId
        if (parameters.id) {
          queryParams.KeyConditionExpression += ' and '
        }
        queryParams.KeyConditionExpression += '#applicationId = :applicationId'
      }

      this.dyndb.query(queryParams).promise().then((data) => {
        logger.info(`${_path} result of query then`)
        return resolve(data)
      }).catch((err) => {
        logger.warn(`${_path} result of query catch`, err.name)
        return reject(err)
      })
    })
  }

  insert (table, item) {
    const _path = `${path} insert:${table}`
    logger.info(`${_path}`, item)

    return new Promise((resolve, reject) => {
      item.createdAt = Date.now()
      item.updatedAt = Date.now()

      const queryParams = {
        TableName: `rp_${table}`,
        Item: item
      }

      this.dyndb.put(queryParams).promise().then(() => {
        logger.info(`${_path} result of put then`)
        resolve(item)
      }).catch((err) => {
        logger.warn(`${_path} result of put catch`, err.name)
        reject(err)
      })
    })
  }

  delete (table, parameters) {
    const _path = `${path} delete:${table}`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        Key: { }
      }

      if (parameters.id) queryParams.Key.id = parameters.id
      if (parameters.applicationId) queryParams.Key.applicationId = parameters.applicationId

      this.dyndb.delete(queryParams).promise().then((data) => {
        logger.info(`${_path} result of delete then`)
        return resolve(data)
      }).catch((err) => {
        logger.warn(`${_path} result of delete catch`, err.name)
        return reject(err)
      })
    })
  }

  update (table, parameters, item) {
    const _path = `${path} update:${table}`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      item.updatedAt = Date.now()
      let conditions = []
      let expValues = {}
      let expNames = {}

      for (let key in item) {
        conditions.push(`#${key} = :${key}`)
        expNames[`#${key}`] = key
        expValues[`:${key}`] = item[key]
      }

      const queryParams = {
        TableName: `rp_${table}`,
        Key: { },
        UpdateExpression: 'SET ' + conditions.join(', '),
        ExpressionAttributeNames: expNames,
        ExpressionAttributeValues: expValues,
        ReturnValues: 'UPDATED_NEW'
      }

      if (parameters.id) queryParams.Key.id = parameters.id
      if (parameters.applicationId) queryParams.Key.applicationId = parameters.applicationId

      this.dyndb.update(queryParams).promise().then((data) => {
        logger.info(`${_path} result of update then`)
        return resolve(data.Attributes)
      }).catch((err) => {
        logger.warn(`${_path} result of update catch`, err.name)
        return reject(err)
      })
    })
  }

  getByUserId (table, parameters) {
    const _path = `${path} getByUserId ${table}`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      let queryParams = {
        TableName: `rp_${table}`,
        // ProjectionExpression: 'id',
        FilterExpression: 'contains(#field,:value)',
        ExpressionAttributeNames: {
          '#field': 'users'
        },
        ExpressionAttributeValues: {
          ':value': parameters.id
        },
        Limit: 10
      }

      if (parameters.applicationId) {
        queryParams.ExpressionAttributeNames['#id'] = 'id'
        queryParams.ExpressionAttributeValues[':id'] = parameters.applicationId
        queryParams.FilterExpression += ' and #id = :id'
      }

      this.dyndb.scan(queryParams).promise().then((data) => {
        logger.info(`${_path} result of scan then`)
        return resolve(data)
      }).catch((err) => {
        logger.warn(`${_path} result of scan catch`, err.name)
        return reject(err)
      })
    })
  }

  listAppend (table, id, attribute, values) {
    const _path = `${path} listAppend ${table}:${attribute}`
    logger.info(`${_path}`, values)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id },
        UpdateExpression: 'SET #field = list_append(:attrValue, #field), #upd = :upd',
        ExpressionAttributeValues: {
          ':attrValue': values,
          ':upd': Date.now()
        },
        ExpressionAttributeNames: {
          '#field': attribute,
          '#upd': 'updatedAt'
        }
      }

      this.dyndb.update(queryParams).promise().then((data) => {
        logger.info(`${_path} result of update then`)
        return resolve(data)
      }).catch((err) => {
        logger.warn(`${_path} result of update catch`, err.name)
        return reject(err)
      })
    })
  }

  listRemoveByIndex (table, id, attribute, indexes) {
    const _path = `${path} listRemoveByIndex ${table}:${attribute}`
    logger.info(`${_path}`, indexes)

    return new Promise((resolve, reject) => {
      let conditions = []
      for (let index in indexes) {
        conditions.push(`#field[${indexes[index]}]`)
      }

      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id },
        UpdateExpression: 'REMOVE ' + conditions.join(', ') + ' SET #upd = :upd',
        ExpressionAttributeValues: {
          ':upd': Date.now()
        },
        ExpressionAttributeNames: {
          '#field': attribute,
          '#upd': 'updatedAt'
        }
      }

      logger.debug(queryParams)

      this.dyndb.update(queryParams).promise().then((data) => {
        logger.info(`${_path} result of update then`)
        return resolve(data)
      }).catch((err) => {
        logger.warn(`${_path} result of update catch`, err.name)
        return reject(err)
      })
    })
  }
}
