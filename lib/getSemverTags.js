// Packages
const semVer = require('semver')
const axios = require('axios')

module.exports = async (gitAuth, details) => {
  let all = await axios.get(`${gitAuth.url}/repos/${details.repoOwner}/${details.repoName}/tags`, gitAuth.h)
  if (all.data.length === 0) return all.data 
  all = all.data.filter(t => semVer.valid(t.name))
  if (all.length > 0) {
    all.sort((a, b) => semVer.lt(a.name, b.name) - semVer.gt(a.name, b.name))
  }

  return all
}
