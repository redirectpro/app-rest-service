require('./app')

before((done) => {
  global.appClass.startListen()
  done()
})

after((done) => {
  global.appClass.stopListen()
  done()
})
