const axios = require('axios')
const changeTypes = require('./changeTypes')
const groupChanges = require('./group')
const applyHook = require('./hook')
const createChangelog = require('./changelog')
const getTags = require('./tags')
const { branchSynced } = require('../lib/repo')


const getReleaseURL = (release, edit = false) => {
    if (!release || !release.html_url) {
      return false
    }
  
    const htmlURL = release.html_url
    return edit ? htmlURL.replace('/tag/', '/edit/') : htmlURL
  }

const checkReleaseStatus = async (flags) => {
    try {
        const unordered = await getTags({
          previousTag: flags.previousTag
        })
        tags = unordered.sort((a, b) => new Date(b.date) - new Date(a.date))
      } catch (err) {
        console.log(err)
        throw new Error('Directory is not a Git repository.')
      }
    
      if (tags.length < 1) {
        throw new Error('No tags available for release.')
      }
    
      const synced = await branchSynced()
    
      if (!synced) {
        throw new Error('Your branch needs to be up-to-date with origin.')
      }
}

const createRelease = async (tag, exists, commits, orderCommitsRes, gitAuth, flags, repoDetails) => {
    const grouped = groupChanges(orderCommitsRes, changeTypes)
    const changes = await createChangelog(grouped, commits, changeTypes, flags.skipQuestions, flags.hook, flags.showUrl)
  
    let { credits, changelog } = changes
  
    if (!changelog) {
      changelog = 'Initial release'
    }
  
    // Apply the `jrelease.js` file or the one that
    // was specified using the `--hook` flag
    changelog = await applyHook(flags.hook, changelog, {
      gitAuth,
      repoDetails,
      changeTypes,
      commits,
      groupedCommits: grouped,
      authors: credits
    })

    const { pre, publish } = flags
  
    const body = {
      /* eslint-disable camelcase */
      tag_name: tag.tag,
      /* target_commitish: tag.hash, */
      /* eslint-enable camelcase */
      body: changelog,
      draft: !publish,
      prerelease: pre
    }
  
    if (exists) {
      body.id = exists
    }
  
    
    const response = await axios.post(`${gitAuth.url}/repos/${repoDetails.user}/${repoDetails.repo}/releases`, body, gitAuth.h)
      // response = await githubConnection.repos[method](body)

    const releaseURL = getReleaseURL(response.data, !publish)
    return releaseURL
  }

  module.exports = { checkReleaseStatus, createRelease, getReleaseURL }