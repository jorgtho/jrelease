// Packages
const chalk = require('chalk')
const inquirer = require('inquirer')
const semVer = require('semver')

module.exports = async (type, preTag) => {
  const preRelease = semVer.valid(semVer.coerce(preTag))
  const newVersion = semVer.inc(preRelease, type)
    const choices = [
      {
        name: `Release current pre-release as release: ${preRelease}`,
        value: preRelease,
        short: `(${preRelease})`
      },
      {
        name: `Release new bumped release: ${newVersion}`,
        value: newVersion,
        short: `(${newVersion})`
      }
    ]
    const questions = [
      {
        name: 'Choose release type',
        message: 'Choose release type',
        type: 'list',
        choices
      }
    ]
    // By default, nothing is there yet
    let answers = {}
    console.log(`${chalk.yellow('!')} Previous release was a pre-release - do you want to release the pre-release as stable or an entirely new release as type "${type}"?`)
    answers = await inquirer.prompt(questions)
    return answers[questions[0].name]
}