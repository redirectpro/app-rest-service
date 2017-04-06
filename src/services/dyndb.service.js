import Promise from 'es6-promise'
import conn from '../connections'
import LoggerHandler from '../handlers/logger.handler'
const logger = LoggerHandler
const path = 'dyndb.service'

export default class DynDBService {
  constructor () {
    this.dyndb = conn.dyndb
  }

  get (params) {
    const _path = `${path} get:${params.table}`
    logger.info(`${_path}`, params.keys)

    return new Promise((resolve, reject) => {
      const getParams = {
        TableName: `rp_${params.table}`,
        Key: params.keys
      }

      this.dyndb.get(getParams).promise().then((data) => {
        logger.info(`${_path} result of get then`)
        return resolve(data)
      }).catch((err) => {
        logger.warn(`${_path} result of get catch`, err.name)
        return reject(err)
      })
    })
  }

  query (params) {
    const _path = `${path} query:${params.table}`
    logger.info(`${_path}`, params)

    return new Promise((resolve, reject) => {
      let expressionAttributeNames = { }
      let expressionAttributeValues = { }
      let keyConditionExpression = []

      Object.keys(params.keys).forEach((e) => {
        expressionAttributeNames[`#${e}`] = e
        expressionAttributeValues[`:${e}`] = params.keys[e]
        keyConditionExpression.push(`#${e} = :${e}`)
      })

      const queryParams = {
        TableName: `rp_${params.table}`,
        IndexName: params.index || undefined,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        KeyConditionExpression: keyConditionExpression.join(' and '),
        Limit: 100
      }

      this.dyndb.query(queryParams).promise().then((data) => {
        logger.info(`${_path} result of query then`)
        return resolve(data)
      }).catch((err) => {
        logger.warn(`${_path} result of query catch`, err.name, err.message)
        return reject(err)
      })
    })
  }

  insert (params) {
    const _path = `${path} insert:${params.table}`
    logger.info(`${_path}`, params)

    return new Promise((resolve, reject) => {
      params.item.createdAt = Date.now()
      params.item.updatedAt = Date.now()

      const putParams = {
        TableName: `rp_${params.table}`,
        Item: params.item
      }

      this.dyndb.put(putParams).promise().then(() => {
        logger.info(`${_path} result of put then`)
        resolve(params.item)
      }).catch((err) => {
        logger.warn(`${_path} result of put catch`, err.name)
        reject(err)
      })
    })
  }

  delete (params) {
    const _path = `${path} delete:${params.table}`
    logger.info(`${_path}`, params.keys)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${params.table}`,
        Key: params.keys
      }

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
}
