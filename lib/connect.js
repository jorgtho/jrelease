// Packages
const axios = require('axios')
const open = require('open')
const Storage = require('configstore')
const { createOAuthDeviceAuth } = require('@octokit/auth-oauth-device')

// Utilities
const pkg = require('../package')
const handleSpinner = require('./spinner')

// Initialize token storage
const config = new Storage(pkg.name)

const sleep = (ms) => {
  if (!ms) throw new Error('Missing required parameter "ms"')
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Simple joke for not storing client id as plain text in github
const constructClientId = () => {
  const clientTukkl = [103, 105, 107, 57,  57,  66, 63,  64,  67, 70, 113, 117, 116, 116, 117, 70,  68, 120, 74,  80]
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
    const gitAuth = { url: 'https://api.github.com',  h: { headers: { Authorization: `token ${token}`, accept: 'application/vnd.github.v3+json' }}}
    handleSpinner.create('Validating access token')
    const user = await axios.get(`${gitAuth.url}/user`, gitAuth.h)
    global.spinner.succeed(`Successfully validated token, hello ${user.data.login}!`)
    return gitAuth
  } catch (error) {
    return false
  }
}

const loadToken = async () => {
  if (config.has('token')) {
    const fromStore = config.get('token')
    console.log('Found local access token, will try to use it')
    const valid = await validateToken(fromStore)

    return valid
  }

  return false
}

const requestToken = async showURL => {
  const auth = createOAuthDeviceAuth({
    clientType: "oauth-app",
    clientId: constructClientId(),
    scopes: ["repo"],
    onVerification(verification) {
      global.spinner.stop()
      console.log("Open %s", verification.verification_uri);
      console.log("Enter code: %s", verification.user_code);
    }
  });
  const tokenAuthentication = await auth({
    type: "oauth",
  });

  config.set('token', tokenAuthentication.token)
  
  const valid = await validateToken(tokenAuthentication.token)

  return valid
}

module.exports = async showURL => {
  let gitAuth = await loadToken()

  if (!gitAuth) {
    handleSpinner.create('Retrieving authentication link')
    await sleep(1000)

    try {
      gitAuth = await requestToken(showURL)
    } catch (err) {
      console.log(err)
      handleSpinner.fail('Could not load token.')
    }
  }
  return gitAuth
}