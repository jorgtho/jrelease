// Packages
const git = require('git-state')
const { runAndReturnGitCommand } = require('./tools/gitConfig')

module.exports = () => {
  const path = process.cwd()
  const states = {
    ignore: ['branch', 'stashes', 'untracked']
  }

  if (!git.isGitSync(path)) return

  try {
    states.check = git.checkSync(path)
  } catch (error) {
    return false
  }
  for (const state of states.ignore) {
    delete states.check[state]
  }
  for (const state in states.check) {
    if (states.check[state] > 0) {
      return false
    }
  }
  runAndReturnGitCommand('git fetch')
  runAndReturnGitCommand('git fetch --tags')
  const status = runAndReturnGitCommand('git status')
  if (status.includes('Your branch is behind')) {
    return false
  }
  return true
}
