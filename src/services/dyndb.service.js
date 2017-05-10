import Promise from 'es6-promise'
import conn from '../connections'
import LoggerHandler from '../handlers/logger.handler'
import config from '../config'

export default class DynDBService {
  constructor () {
    this.path = 'dyndb.service'
    this.logger = new LoggerHandler()
    this.dyndb = conn.dyndb
    this.logger.info(`${this.path} constructor`)
  }

  get (params) {
    const table = `${config.dynamodbPrefix}${params.table}`
    const _path = `${this.path} get:${table}`
    this.logger.info(`${_path}`, params.keys)

    return new Promise((resolve, reject) => {
      const getParams = {
        TableName: table,
        Key: params.keys
      }

      this.dyndb.get(getParams).promise().then((data) => {
        this.logger.info(`${_path} result of get then`)
        return resolve(data)
      }).catch((err) => {
        this.logger.warn(`${_path} result of get catch`, err.name)
        return reject(err)
      })
    })
  }

  query (params) {
    const table = `${config.dynamodbPrefix}${params.table}`
    const _path = `${this.path} query:${table}`
    this.logger.info(`${_path}`, params)

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
        TableName: table,
        IndexName: params.index || undefined,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        KeyConditionExpression: keyConditionExpression.join(' and '),
        Limit: 100
      }

      this.dyndb.query(queryParams).promise().then((data) => {
        this.logger.info(`${_path} result of query then`)
        return resolve(data)
      }).catch((err) => {
        this.logger.warn(`${_path} result of query catch`, err.name, err.message)
        return reject(err)
      })
    })
  }

  insert (params) {
    const table = `${config.dynamodbPrefix}${params.table}`
    const _path = `${this.path} insert:${table}`
    this.logger.info(`${_path}`, params)

    return new Promise((resolve, reject) => {
      params.item.createdAt = Date.now()
      params.item.updatedAt = Date.now()

      const putParams = {
        TableName: table,
        Item: params.item
      }

      this.dyndb.put(putParams).promise().then(() => {
        this.logger.info(`${_path} result of put then`)
        resolve(params.item)
      }).catch((err) => {
        this.logger.warn(`${_path} result of put catch`, err.name)
        reject(err)
      })
    })
  }

  delete (params) {
    const table = `${config.dynamodbPrefix}${params.table}`
    const _path = `${this.path} delete:${table}`
    this.logger.info(`${_path}`, params.keys)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: table,
        Key: params.keys
      }

      this.dyndb.delete(queryParams).promise().then((data) => {
        this.logger.info(`${_path} result of delete then`)
        return resolve(data)
      }).catch((err) => {
        this.logger.warn(`${_path} result of delete catch`, err.name)
        return reject(err)
      })
    })
  }

  update (params) {
    const table = `${config.dynamodbPrefix}${params.table}`
    const _path = `${this.path} update:${table}`
    this.logger.info(`${_path}`, params.keys)

    return new Promise((resolve, reject) => {
      params.item.updatedAt = Date.now()
      let conditions = []
      let expValues = {}
      let expNames = {}

      for (let key in params.item) {
        conditions.push(`#${key} = :${key}`)
        expNames[`#${key}`] = key
        expValues[`:${key}`] = params.item[key]
      }

      const queryParams = {
        TableName: table,
        Key: { },
        UpdateExpression: 'SET ' + conditions.join(', '),
        ExpressionAttributeNames: expNames,
        ExpressionAttributeValues: expValues,
        ReturnValues: 'UPDATED_NEW'
      }

      if (params.keys.id) queryParams.Key.id = params.keys.id
      if (params.keys.applicationId) queryParams.Key.applicationId = params.keys.applicationId

      this.dyndb.update(queryParams).promise().then((data) => {
        this.logger.info(`${_path} result of update then`)
        return resolve(data.Attributes)
      }).catch((err) => {
        this.logger.warn(`${_path} result of update catch`, err.name)
        return reject(err)
      })
    })
  }
}
