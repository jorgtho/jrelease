// Packages
const semVer = require('semver')
const axios = require('axios')
const { runAndReturnGitCommand } = require('./tools/gitConfig')

const parseLocalTags = (local) => {
  const lines = local.split(/\r?\n/).map(t => t.trim())
  const tags = lines.filter(t => semVer.valid(t))
  return tags
}

module.exports = async (gitAuth, details) => {
  const tags = {
    remote: false,
    local: false
  }
  let all = await axios.get(`${gitAuth.url}/repos/${details.repoOwner}/${details.repoName}/tags`, gitAuth.h)
  if (all.data.length === 0) { 
    tags.remote = [{name: '0.0.0'}]
  } else {
    all = all.data.filter(t => semVer.valid(t.name))
    if (all.length > 0) {
      all.sort((a, b) => semVer.lt(a.name, b.name) - semVer.gt(a.name, b.name))
      tags.remote = all
    } else {
      tags.remote = [{name: '0.0.0'}]
    }
  }
  
  let local = runAndReturnGitCommand('git tag --sort=-v:refname')
  tags.local = parseLocalTags(local)

  return tags
}
