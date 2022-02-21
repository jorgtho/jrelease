// Native
const path = require('path')
const { promisify } = require('util')
const { exec } = require('child_process')

// Packages
const fs = require('fs-extra')
const semver = require('semver')
const { bold } = require('chalk')

// Utilities
const { fail, create: createSpinner } = require('./spinner')
const choosePre = require('./choosePre')

const getNewVersion = async (type, preSuffix, pre, oldVersionOverride, bump = false) => {
  const pkgPath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(pkgPath)) {
    throw new Error('The "package.json" file doesn\'t exist')
  }

  let pkgContent

  try {
    pkgContent = await fs.readJSON(pkgPath)
  } catch (err) {
    throw new Error('Couldn\'t parse "package.json"')
  }

  if (!pkgContent.version) {
    throw new Error('No "version" field inside "package.json"')
  }

  let { version: oldVersion } = pkgContent
  if (oldVersionOverride) oldVersion = oldVersionOverride
  const isPre = semver.prerelease(oldVersion)
  const shouldBePre = pre

  if (shouldBePre && !preSuffix) {
    if (!isPre) preSuffix = 'canary'
  }

  let newVersion
  if (shouldBePre) {
    if (isPre) {
      newVersion = semver.inc(oldVersion, 'pre', preSuffix)
    } else {
      newVersion = semver.inc(oldVersion, type)
      newVersion = semver.inc(newVersion, 'pre', preSuffix) // bump up the nnuuumber, am drunk
    }
  } else if (isPre && !shouldBePre) {
    global.spinner.stop()
    global.spinner = false
    console.log('')
    newVersion = await choosePre(type, oldVersion)
  } else {
    newVersion = semver.inc(oldVersion, type)
  }

  return { newVersion, pkgPath, pkgContent }
}

const increment = async (type, preSuffix, pre, oldVersionOverride) => {
  const { newVersion, pkgPath, pkgContent } = await getNewVersion(type, preSuffix, pre, oldVersionOverride, bump = true)
  
  pkgContent.version = newVersion

  try {
    await fs.writeJSON(pkgPath, pkgContent, {
      spaces: 2
    })
  } catch (err) {
    throw new Error('Couldn\'t write to "package.json"')
  }

  const lockfilePath = path.join(process.cwd(), 'package-lock.json')

  if (!fs.existsSync(lockfilePath)) {
    return newVersion
  }

  let lockfileContent

  try {
    lockfileContent = await fs.readJSON(lockfilePath)
  } catch (err) {
    throw new Error('Couldn\'t parse "package-lock.json"')
  }

  lockfileContent.version = newVersion

  try {
    await fs.writeJSON(lockfilePath, lockfileContent, {
      spaces: 2
    })
  } catch (err) {
    throw new Error('Couldn\'t write to "package-lock.json"')
  }

  return newVersion
}

const runGitCommand = async command => {
  try {
    await promisify(exec)(command)
  } catch (err) {
    if (err.message.includes('Not a git repository')) {
      throw new Error('Directory is not a Git repository')
    }

    throw err
  }
}

const bumpVersion = async (type, preSuffix, pre, oldVersionOverride) => {
  let version
  try {
    version = await increment(type, preSuffix, pre, oldVersionOverride)
  } catch (err) {
    fail(err.message)
  }

  createSpinner('Bumping version tag')
  global.spinner.text = `Bumped version tag to ${bold(version)}`
  createSpinner('Creating release commit')

  try {
    await runGitCommand(`git add -A && git commit -a -m "${version}"`)
  } catch (err) {
    fail(err.message)
  }

  global.spinner.text = 'Created release commit'
  createSpinner('Tagging commit')

  try {
    await runGitCommand(`git tag ${version}`)
  } catch (err) {
    fail(err.message)
  }

  global.spinner.text = 'Tagged commit'
  createSpinner('Pushing everything to remote')

  try {
    // await runGitCommand('git push && git push --tags')
    runGitCommand(`git push`)
    runGitCommand(`git push origin ${version}`)
  } catch (err) {
    fail(err.message)
  }

  global.spinner.succeed('Pushed everything to remote')
  global.spinner = null
  return version
}

module.exports = { bumpVersion, getNewVersion }
