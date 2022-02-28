// Packages
const inquirer = require('inquirer')
const { stopSpinner, create: createSpinner, fail } = require('./spinner')

module.exports = async (releases, details) => {
  if (releases.amount === 0) return
  if (releases.latestOnBranch && releases.latest.tag_name === releases.latestOnBranch.tag_name) return false

  // Reset spinner
  stopSpinner()
  console.log('')

  const choices = [
    {
      name: '   Yes, continue, and stop bothering me with stupid questions.',
      value: true,
      short: 'Yes'
    },
    {
      name: '   No, stop the release! I forgot which branch I was on...',
      value: false,
      short: 'No'
    }
  ]

  let questionMessage
  if (releases.latestOnBranch) {
    questionMessage = `Previous release "${releases.latest.tag_name}" was published from branch "${releases.latest.target_commitish}" - you are currently on branch "${details.currentBranch}" where the latest release was ${releases.latestOnBranch.tag_name}. Are you sure you want to continue?`
  } else {
    questionMessage = `Previous release "${releases.latest.tag_name}" was published from branch "${releases.latest.target_commitish}" - you are currently on branch "${details.currentBranch}" where you have no recent releases. Are you sure you want to continue?`
  }

  const questions = [
    {
      name: 'New release branch - continue?',
      message: questionMessage,
      type: 'list',
      choices
    }
  ]
  answers = await inquirer.prompt(questions)

  console.log('')

  if (!answers[questions[0].name]) {
    createSpinner('Release stopped by user - check branch stuff')
    fail('nope', false)
  }
}
