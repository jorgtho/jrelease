// Packages
const semVer = require('semver')
const { promisify } = require('util')
const taggedVersions = require('tagged-versions')
const { exec } = require('child_process')

const defaultRev = 'HEAD --first-parent "$(git rev-parse --abbrev-ref HEAD)"'
const defaultWinRev = (branch) => { return `HEAD --first-parent ${branch}` }

const defaultOptions = {
  rev: defaultRev,
  previousTag: ''
}

const runAndReturnGitCommand = async command => {
  try {
    const res = await promisify(exec)(command)
    return res.stdout
  } catch (err) {
    if (err.message.includes('Not a git repository')) {
      throw new Error('Directory is not a Git repository')
    }
    throw err
  }
}

const getTags = async (options = {}) => {
  let { rev, previousTag } = { ...defaultOptions, ...options }
  if (process.platform === 'win32') {
    const branch = await runAndReturnGitCommand('git rev-parse --abbrev-ref HEAD')
    rev = defaultWinRev(branch)
  }
  const [tags, latest] = await Promise.all([
    taggedVersions.getList({ rev }),
    taggedVersions.getLastVersion({ rev })
  ])

  if (!latest) {
    return []
  }

  const isPreviousTag = previousTag && previousTag.length > 0 ? commitVersion => commitVersion === previousTag : semVer.lt

  for (const commit of tags) {
    if (isPreviousTag(commit.version, latest.version)) {
      return [latest, commit]
    }
  }
  return [latest]
}

module.exports = { getTags, runAndReturnGitCommand }
