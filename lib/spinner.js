// Packages
const ora = require('ora')
const { red } = require('chalk')

exports.create = message => {
  if (global.spinner) {
    global.spinner.succeed()
  }

  global.spinner = ora(message).start()
}

exports.stopSpinner = () => {
  if (global.spinner) {
    global.spinner.stop()
    global.spinner = false
  }
}

exports.fail = (message, withError = true) => {
  if (global.spinner) {
    global.spinner.fail()
    console.log('')
  }

  if (withError) console.error(`${red('Error!')} ${message}`)
  process.exit(1)
}
