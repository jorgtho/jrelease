// Native
const path = require('path')
const fs = require('fs')

// Packages
const semVer = require('semver')
const { bold } = require('chalk')
const { runGitCommand, setSafeCrlf, resetSafeCrlf } = require('./tools/gitConfig')

// Utilities
const { create: createSpinner } = require('./spinner')

const bumpPkg = (newVersion) => {
  const changes = {
    pkg: false,
    lock: false
  }
  const pkg = {
    pkgPath: path.join(process.cwd(), 'package.json'),
    content: false,
    lockPath: path.join(process.cwd(), 'package-lock.json'),
    lockContent: false
  }
  if (!fs.existsSync(pkg.pkgPath)) {
    throw new Error('The "package.json" file doesn\'t exist')
  }
  pkg.content = require(pkg.pkgPath)
  if (!pkg.content.version) {
    throw new Error('No "version" field inside "package.json"')
  }
  if (pkg.content.version !== newVersion) {
    pkg.content.version = newVersion
    fs.writeFileSync(pkg.pkgPath, JSON.stringify(pkg.content, null, 2))
    changes.pkg = true
  }
  
  if (!fs.existsSync(pkg.lockPath)) {
    return newVersion
  }
  pkg.lockContent = require(pkg.lockPath)
  if (!pkg.lockContent.version) {
    throw new Error('No "version" field inside "package-lock.json"')
  }
  if (pkg.lockContent.version !== newVersion) {
    pkg.lockContent.version = newVersion
    fs.writeFileSync(pkg.lockPath, JSON.stringify(pkg.lockContent, null, 2))
    changes.lock = true
  }
  if (changes.lock || changes.pkg) return true
  return false
}

const getNewVersion = (prevTag, localTags, bumpType, preSuffix) => {
  const res = {
    alreadyExists: false,
    newVersion: false
  }
  if (prevTag === '0.0.0') {
    res.newVersion = semVer.inc(prevTag, 'major')
  } else {
    res.newVersion = semVer.inc(prevTag, bumpType, preSuffix)
  }
  if (localTags.includes(res.newVersion)) {
    res.alreadyExists = res.newVersion
    res.newVersion = semVer.inc(localTags[0], bumpType, preSuffix)
  }
  return res
}

const bumpAndPush = (tags, bumpType, flags) => {

  const { newVersion, alreadyExists } = getNewVersion(tags.remote[0].name, tags.local, bumpType, flags.preSuffix)
  createSpinner(`Bumping version tag from ${bold(tags.remote[0].name)} to ${bold(newVersion)}`)
  if (alreadyExists) createSpinner(`Oh crap, tag ${bold(alreadyExists)} already exists locally.. Will bump from latest local tag ${bold(tags.local[0])} to ${bold(newVersion)} instead`, true)

  const changes = bumpPkg(newVersion)

  if (changes) {
    createSpinner('Creating release commit', alreadyExists)
    let crlf
    if (!flags.crlf) crlf = setSafeCrlf() 
    runGitCommand('git add -A') // TODO add ora-promise
    runGitCommand(`git commit -a -m "${newVersion}" --quiet`)
    if (!flags.crlf) resetSafeCrlf(crlf)
  } else {
    createSpinner('package.json and package-lock was already up to date', alreadyExists)
  }

  createSpinner('Tagging commit')
  runGitCommand(`git tag -a ${newVersion} -m "jrelease-tag ${newVersion}"`)

  createSpinner('Pushing everything to remote')
  runGitCommand('git push --follow-tags --quiet')

  return newVersion
}

module.exports = { bumpAndPush, getNewVersion }
