// Packages
const git = require('git-state')
const repoName = require('git-repo-name')
const axios = require('axios')
const fs = require('fs');
const { errorMonitor } = require('events');

const getRepoOwner = () => {
  const gitConfig = `${process.cwd()}/.git/config`
    if (fs.existsSync(gitConfig)) {
        const gitUrl = fs.readFileSync(gitConfig, 'utf8').split(/\r?\n/).filter(str => (str.includes('https://github.com/') && str.includes('url')))
        if (gitUrl.length === 1) {
            return gitUrl[0].split('https://github.com/')[1].split('/')[0]
        }
        else {
            throw new Error('Could not find repo-owner, make sure the remote git-repo is hosted at "https://github.com/"')
        }
    } else {
        throw new Error('Could not locate .git directory')
    }
}

exports.getRepo = async gitAuth => {
  const details = {}
  details.repo = repoName.sync()
  details.user = getRepoOwner()
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
  const all = await axios.get(`${gitAuth.url}/repos/${details.user}/${details.repo}/releases`, gitAuth)
  let latest
  if (all.data.length > 0) {
    try {
      latest = await axios.get(`${gitAuth.url}/repos/${details.user}/${details.repo}/releases/latest`, gitAuth)
    } catch (error) {
      if (error.response.status === 404) {
        latest = { data: false }
      } else {
        throw new Error(error)
      }
    }
  } else {
    latest = { data: false }
  }

  return { all: all.data, latest: latest.data }
}

exports.getTagHash = async (gitAuth, details, tag) => {
  const tags = await axios.get(`${gitAuth.url}/repos/${details.user}/${details.repo}/tags`, gitAuth)
  const tagInfo = tags.data.find(t => t.name === tag)
  if (!tagInfo) throw new Error(`Could not find sha for tag '${tagInfo}'`)
  return tagInfo.commit.sha
}
