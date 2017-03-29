import App from '../index'

if (!global.testStarted) {
  global.testStarted = true

  /* Prepar app */
  global.appClass = new App()
  global.appClass.prepar()
}

export default global.appClass.returnApp()
