// Packages
const chalk = require('chalk')
const inquirer = require('inquirer')

module.exports = async (releasetag, committag) => {
  const choices = [
    {
      name: `Latest release tag: ${releasetag}`,
      value: true,
      short: `(${releasetag})`
    },
    {
      name: `Latest tag: ${committag}`,
      value: false,
      short: `(${committag})`
    }
  ]
  const questions = [
    {
      name: 'Choose tag',
      message: 'Choose tag',
      type: 'list',
      choices
    }
  ]
  // By default, nothing is there yet
  let answers = {}
  console.log(`${chalk.yellow('!')} Latest (commit) tag is not the same as the latest release tag.`)
  console.log(`${chalk.green('!')} Please enter the tag you want to start your changelog from:\n`)
  answers = await inquirer.prompt(questions)

  if (answers[questions[0].name]) { // true or false
    return releasetag // User chose the release tag as starting point for changelog
  }
  return false // User chose the latest commit tag as starting point for changelog, useReleaseTag -> false
}
