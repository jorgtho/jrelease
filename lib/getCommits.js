const { commit } = require('git-state')
const { runAndReturnGitCommand } = require('./tools/gitConfig')

const parseCommits = (rawCommits) => {
  return rawCommits
}

module.exports = (fromHash, toHash = 'HEAD') => {
  const range = fromHash ? ` ${fromHash}..${toHash}` : ''
  const format = '%h%x09%an%x09%ad%x09%s%x09%b'

  const rawCommits = runAndReturnGitCommand(`git rev-list pretty=format:${format}${range}`)
  const commits = parseCommits(rawCommits)

  return commits
}
