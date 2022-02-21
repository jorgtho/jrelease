const semVer = require('semver')

const getCommits = require('./commits')

module.exports = async (tags, exists = false) => {
  let commits
  try {
    commits = await getCommits(tags)
  } catch (err) {
    throw new Error('Failed to load commits')
  }

  for (const commit of commits.all) {
    if (semVer.valid(commit.title)) {
      const index = commits.all.indexOf(commit)
      commits.all.splice(index, 1)
    }
  }

  if (commits.length < 1) {
    throw new Error('No changes happened since the last release')
  }
  return { commits, exists }
}
