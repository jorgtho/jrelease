// Packages
const semVer = require('semver')
const { runAndReturnGitCommand } = require('./tools/gitConfig')

const parseTag = (tag) => {
  const res = {}
  const tagInfo = tag.split(';')
  res.tag = (tagInfo[0].split(':').length === 2) ? tagInfo[0].split(':')[1].trim() : 'null '
  res.tag = res.tag.substring(0, res.tag.length - 1)
  res.hash = tagInfo[1]
  res.date = tagInfo[2]
  return res
}

const parseTags = (rawTags) => {
  let tags = rawTags.split('\n')
  tags = tags.map(t => parseTag(t))
  tags = tags.filter(t => (semVer.valid(t.tag)))
  tags.sort((a, b) => semVer.lt(a.tag, b.tag) - semVer.gt(a.tag, b.tag))
  return tags
}

const gitCommand = 'git log --simplify-by-decoration --pretty="%d;%H;%ci" --decorate=short HEAD --first-parent "$(git rev-parse --abbrev-ref HEAD)"'
const winGitCommand = (branch) => { return `git log --simplify-by-decoration --pretty="%d;%H;%ci" --decorate=short HEAD --first-parent ${branch}` }

const getTags = () => {
  let command = gitCommand
  if (process.platform === 'win32') {
    const branch = runAndReturnGitCommand('git rev-parse --abbrev-ref HEAD')
    command = winGitCommand(branch)
  }

  const rawTags = runAndReturnGitCommand(command)
  const tags = parseTags(rawTags)
  return tags
}

module.exports = { getTags }
