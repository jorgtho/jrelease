// Packages
const git = require('git-state')
const repoName = require('git-repo-name')
const repoUser = require('git-username')
const axios = require('axios')

exports.getRepo = async gitAuth => {
  const details = {}
  details.repo = repoName.sync()
  try {
    const detailedRepo = await axios.get(`${gitAuth.url}/repos/${repoUser()}/${details.repo}`, gitAuth)
    details.user = detailedRepo.data.owner.login
  } catch (error) {
    throw new Error('Failed to get repo details')
  }
  return details
}

exports.branchSynced = () => {
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
  return true
}

exports.getReleases = async (gitAuth, details) => {
  let res
  try {
    res = await axios.get(`${gitAuth.url}/repos/${details.user}/${details.repo}/releases`, gitAuth)
    return res
  } catch (error) {
    return
  }
}
