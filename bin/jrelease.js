#!/usr/bin/env node

// Packages
const nodeVersion = require('node-version')
const { red } = require('chalk')
const chalk = require('chalk')
const args = require('args')
const open = require('open')
const checkForUpdate = require('update-check')

// Utilities
const { fail, create: createSpinner } = require('../lib/spinner')
const getBumpType = require('../lib/getBumpType')
const { connect, requestToken } = require('../lib/connect')
const { getRepoDetails } = require('../lib/tools/gitConfig')
const branchSynced = require('../lib/branchSynced')
const { getReleases } = require('../lib/release')
const getCommits = require('../lib/getCommits')
const checkPrevTag = require('../lib/checkPrevTag')
const checkReleaseBranch = require('../lib/checkReleaseBranch')
const getSemverTags = require('../lib/getSemverTags')

// Throw an error if node version is too low
if (nodeVersion.major < 8) {
  console.error(`${red('Error!')} Requires at least version 8 of Node. Please upgrade!`)
  process.exit(1)
}

// Throw an error if repo is not up-to-date with remote
try {
  if (!branchSynced()) {
    console.error(`${red('Error!')} Repo is not up-to-date with origin`) // Would you like to commit everything and push to origin??
    process.exit(1)
  }
} catch (error) {
  console.error(`${red('Error!')} Working dir is not a git repo`)
  process.exit(1)
}

// Get args
args.option('pre-suffix', 'Provide a suffix for a prerelease, "canary" is used as default', 'canary')
  .option('publish', 'Instead of creating a draft, publish the release')
  .option(['H', 'hook'], 'Specify a custom file to pipe releases through')
  .option(['t', 'previous-tag'], 'Manually specify previous release', '')
  .option(['u', 'show-url'], 'Show the release URL instead of opening it in the browser')
  .option(['s', 'skip-questions'], 'Skip the questions and create a simple list without the headings')
  .option(['l', 'list-commits'], 'Only lists commits since previous release (does not change anything)')

flags = args.parse(process.argv)

// Control of values used here and there
const control = {
  flags: args.parse(process.argv),
  bumpType: args.sub,
  gitAuth: false,
  repoDetails: false,
  tags: false,
  releases: false,
  commits: false,
  changes: false,
  fromTagHash: false
}

const main = async () => {
  // const update = await checkForUpdate(pkg);
  const update = false

  if (update) {
    console.log(`${chalk.bgRed('UPDATE AVAILABLE')} The latest version of \`jrelease\` is ${update.latest}`)
  }

  // If flag --list-commits, simply list commits since latest release, and finish
  if (control.flags.listCommits) {
    createSpinner('Getting commits since last release')
    try {
      await listCommits(control.flags) // needs rewrite
      process.exit(1)
    } catch (error) {
      console.log(error)
      fail(error)
      process.exit(1)
    }
  }

  // Verify bumpType
  try {
    const bumpType = getBumpType(control.bumpType)
    control.bumpType = bumpType.bumpType
    control.flags.pre = bumpType.isPre
  } catch (error) {
    fail(error)
  }

  // Authenticate with GitHub
  try {
    createSpinner('Authenticating with GitHub')
    control.gitAuth = await connect()
  } catch (error) {
    fail(error)
  }

  // Get repo details
  try {
    createSpinner('Fetching repo details from .git/config')
    control.repoDetails = await getRepoDetails(`${process.cwd()}/.git/config`)
  } catch (error) {
    fail(error)
  }

  // Get previous releases and tags
  try {
    createSpinner('Fetching releases and tags')
    control.tags = await getSemverTags(control.gitAuth, control.repoDetails)
    control.releases = await getReleases(control.gitAuth, control.repoDetails)
  } catch (error) {
    fail(error)
  }

  // Check if branch trouble
  try {
    createSpinner('Checking release source branch')
    await checkReleaseBranch(control.releases, control.repoDetails)
  } catch (error) {
    fail(error)
  }

  // Check where to start changelog from
  try {
    createSpinner('Checking where to start changelog from')
    control.fromTagHash = await checkPrevTag(control.releases, control.tags, control.repoDetails)
  } catch (error) {
    console.log(error)
    fail(error)
  }


  // Get commits from previous tag
  /*
  try {
    createSpinner('Fetching commits since last release')
    control.tags = getCommits(control.latestRelease.)
    control.releases = await getReleases(control.gitAuth, control.repoDetails)
  } catch (error) {
    fail(error)
  } */

  if (global.spinner) global.spinner.succeed()
  console.log(control.fromTagHash)
  process.exit(1)
}

// Let the firework start
main()
