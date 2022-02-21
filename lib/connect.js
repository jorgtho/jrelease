// Packages
const axios = require('axios')
// const open = require('open') maybe enable in future release
const Storage = require('configstore')
const { createOAuthDeviceAuth } = require('@octokit/auth-oauth-device')
const sleep = require('./sleep')

// Utilities
const pkg = require('../package')

// Initialize token storage
const config = new Storage(pkg.name)

// Simple joke for not storing client id as plain text in github
const constructClientId = () => {
  const clientTukkl = [103, 105, 107, 57, 57, 66, 63, 64, 67, 70, 113, 117, 116, 116, 117, 70, 68, 120, 74, 80]
  let papayo = 3
  let ci = clientTukkl.map(c => {
    papayo++
    return String.fromCharCode(c - papayo)
  })
  ci = ci.join('')
  return ci
}

const validateToken = async (token) => {
  try {
    const gitAuth = { url: 'https://api.github.com', h: { headers: { Authorization: `token ${token}`, accept: 'application/vnd.github.v3+json' } } }
    await axios.get(`${gitAuth.url}/user`, gitAuth.h)
    return gitAuth
  } catch (error) {
    return false
  }
}

const loadToken = async () => {
  if (config.has('token')) {
    const fromStore = config.get('token')
    const valid = await validateToken(fromStore)
    return valid
  }

  return false
}

const requestToken = async showURL => {
  // First - hold on a second, to bother the user
  await sleep(1000)

  const auth = createOAuthDeviceAuth({
    clientType: 'oauth-app',
    clientId: constructClientId(),
    scopes: ['repo'],
    onVerification (verification) {
      global.spinner.stop()
      console.log('Open %s', verification.verification_uri)
      console.log('Enter code: %s', verification.user_code)
    }
  })
  const tokenAuthentication = await auth({
    type: 'oauth'
  })

  config.set('token', tokenAuthentication.token)

  const valid = await validateToken(tokenAuthentication.token)

  return valid
}

const connect = async showURL => {
  let gitAuth = await loadToken()

  if (!gitAuth) {
    try {
      gitAuth = await requestToken(showURL)
    } catch (err) {
      throw new Error('Could not get token, the developer of jrelease has probably been an idiot')
    }
  }
  return gitAuth
}

module.exports = { connect, requestToken }
