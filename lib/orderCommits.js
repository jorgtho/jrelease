// Packages
const chalk = require('chalk')
const inquirer = require('inquirer')
const semVer = require('semver')

// Util
const changeTypes = require('./changeTypes')
const { stopSpinner } = require('./spinner')

const getChoices = (bumpType) => {
  const choices = []
  const includeChoices = changeTypes.find(c => c.handle === bumpType).includeQuestions
  includeChoices.forEach(c => {
    const choice = changeTypes.find(x =>  x.handle === c)
    choices.push({
      name: `${choice.name} (${choice.description})`,
      value: choice.handle,
      short: `(${choice.short})`
    })
  })
  if (choices.length > 1) {
    choices.push(new inquirer.Separator())
    choices.push({
      name: `Ignore (exclude from changelog)`,
      value: 'exclude',
      short: `(exclude)`
    })
  }
  return choices
}

module.exports = async (commits, bumpType, flags) => {
  const res = {
    major: [],
    minor: [],
    patch: [],
    ifSkipQuestions: []
  }

  commits = commits.filter(c => !semVer.valid(c.subject)) // Filter out commits which are tags

  const questions = []

  const choices = getChoices(bumpType)

  // Show the earliest changes first
  commits.reverse()

  // If skipQuestions-flag - return all commits
  if (flags.skipQuestions) {
    res.ifSkipQuestions = commits
    return res
  }

  // If no choices - just return everythin as a patch
  if (choices.length === 0) {
    res.patch = commits
    return res
  }

  for (const commit of commits) {
    const commitTitle = (commit.subject !== '') ? commit.subject : commit.body

    // In the future - add that user can set bumptype in commit subject

    questions.push({
      name: commit.hash,
      message: commitTitle,
      type: 'list',
      choices
    })
  }

  // Collect answers for each commit
  let answers = {}

  if (choices && questions.length > 0) {
    stopSpinner()
    console.log(`${chalk.green('!')} Please enter the type of change for each commit:`)
    answers = await inquirer.prompt(questions)

    for (const question of questions) {
      const answer = answers[question.name]
      if (answer !== 'exclude') res[answer].push(commits.find(c => c.hash === question.name))
    }
  }
  return res
}
