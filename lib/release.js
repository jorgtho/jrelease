const axios = require('axios')
const semVer = require('semver')

const getReleaseURL = (release, edit = false) => {
  if (!release || !release.html_url) {
    return false
  }
  const htmlURL = release.html_url
  return edit ? htmlURL.replace('/tag/', '/edit/') : htmlURL
}

const createRelease = async (gitAuth, flags, repoDetails, tag, changelog) => {
  const { pre, publish } = flags

  const body = {
    /* eslint-disable camelcase */
    tag_name: tag,
    /* target_commitish: tag.hash, */
    /* eslint-enable camelcase */
    body: changelog,
    draft: !publish,
    prerelease: pre
  }
  const response = await axios.post(`${gitAuth.url}/repos/${repoDetails.repoOwner}/${repoDetails.repoName}/releases`, body, gitAuth.h)
  const releaseURL = getReleaseURL(response.data, !publish)
  return releaseURL
}

const getReleases = async (gitAuth, details) => {
  const res = {
    all: [],
    releases: [],
    preReleases: [],
    drafts: [],
    latest: false,
    latestOnBranch: false,
    amount: 0
  }
  let all = await axios.get(`${gitAuth.url}/repos/${details.repoOwner}/${details.repoName}/releases`, gitAuth.h) // TODO - move the bottom part into a function that can be tested
  if (all.data.length === 0) return res
  all = all.data.filter(r => semVer.valid(r.tag_name))
  res.amount = all.length
  if (all.length > 0) {
    all.sort((a, b) => semVer.lt(a.tag_name, b.tag_name) - semVer.gt(a.tag_name, b.tag_name))
    res.all = all
    const onBranch = all.filter(r => r.target_commitish === details.currentBranch)
    res.latestOnBranch = onBranch[0]
    res.latest = all[0]
    res.drafts = all.filter(r => r.draft)
    res.preReleases = all.filter(r => r.prerelease)
    res.releases = all.filter(r => (!r.draft && !r.prerelease))
  }

  return res
}

module.exports = { createRelease, getReleaseURL, getReleases }
