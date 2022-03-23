#!/usr/bin/env node

// User feedback
const chalk = require('chalk')
console.log(`Starting ${chalk.yellow('jrelease')}, please wait...`)

// Packages and utilities
const pkg = require('../package.json')
const { fail, create: createSpinner } = require('../lib/spinner')
const nodeVersion = require('node-version')
const { red } = require('chalk')
const args = require('args')
const checkForUpdate = require('update-check')
const branchSynced = require('../lib/branchSynced')
const getBumpType = require('../lib/getBumpType')
const { connect, requestToken } = require('../lib/connect')
const open = require('open')
const { getRepoDetails } = require('../lib/tools/gitConfig')
const { getReleases, createRelease } = require('../lib/release')
const getCommits = require('../lib/getCommits')
const checkPrevTag = require('../lib/checkPrevTag')
const checkReleaseBranch = require('../lib/checkReleaseBranch')
const getSemverTags = require('../lib/getSemverTags')
const orderCommits = require('../lib/orderCommits')
const createChangelog = require('../lib/createChangelog')
const { bumpAndPush } = require('../lib/bumpAndPush')
const sleep = require('../lib/sleep')
const listCommits = require('../lib/listCommits')

// Throw an error if node version is too low
if (nodeVersion.major < 8) {
  console.error(`${red('Error!')} Requires at least version 8 of Node. Please upgrade!`)
  process.exit(1)
}

// Get args
args.option('pre-suffix', 'Provide a suffix for a prerelease, "canary" is used as default', 'canary')
  .option('publish', 'Instead of creating and opening a draft, publish the release')
  .option(['t', 'previous-tag'], 'Manually specify previous release', '')
  .option(['u', 'show-url'], 'Show the release URL instead of opening it in the browser')
  .option(['s', 'skip-questions'], 'Skip the questions and create a simple list without the headings')
  .option(['l', 'list-commits'], 'Only lists commits since previous release (does not change anything)')
  .option(['c', 'crlf'], 'do not temporarily set core.safecrlf to "false". (If you are not familliar with git config crlf settings, dont worry about this flag)')
  // .option(['H', 'hook'], 'Specify a custom file to pipe releases through') // not implemented

flags = args.parse(process.argv)

// Throw an error if repo is not up-to-date with remote
try {
  if (!branchSynced() && !flags.listCommits) { // do not bother if we are only listing commits
    console.error(`${red('Error!')} Repo is not up-to-date with origin`) // Would you like to commit everything and push to origin??
    process.exit(1)
  }
} catch (error) {
  console.error(`${red('Error!')} Working dir is not a git repo`)
  process.exit(1)
}

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
  fromTag: false
}

const main = async () => {
  try {
    const update = await checkForUpdate(pkg)
    if (update) {
      console.log(`${chalk.bgRed('UPDATE AVAILABLE')} The latest version of \`jrelease\` is ${update.latest}`)
    }
  } catch (error) {
    console.log('Could not check for update')
  }

  // Verify bumpType
  try {
    if (!control.flags.listCommits) { // Do not bother if we are just listing commits
      const bumpType = getBumpType(control.bumpType)
      control.bumpType = bumpType.bumpType
      control.flags.pre = bumpType.isPre
    }
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
    if (!control.flags.listCommits) { // Do not bother if we are just listing commits
      createSpinner('Checking release source branch')
      await checkReleaseBranch(control.releases, control.repoDetails)
    }
  } catch (error) {
    fail(error)
  }

  // Check where to start changelog from
  try {
    createSpinner('Checking where to start changelog from')
    control.fromTag = await checkPrevTag(control.releases, control.tags.remote, control.repoDetails)
  } catch (error) {
    fail(error)
  }

  // Get commits from previous tag
  try {
    createSpinner('Fetching commits since last release')
    control.commits = getCommits(control.fromTag.hash)
  } catch (error) {
    fail(error)
  }

  try {
    if (control.flags.listCommits) {
      await listCommits(control.commits, control.fromTag.tag)
      process.exit()
    }
  } catch (error) {
    fail(error)
  }

  // Create changelog (md)
  try {
    control.orderedCommits = await orderCommits(control.commits, control.bumpType, control.flags)
    createSpinner('Creating changelog')
    control.changelog = createChangelog(control.orderedCommits, control.fromTag.hash)
  } catch (error) {
    console.log(error)
    fail(error)
  }
  
  // Bump and push to remote
  try {
    control.bump = bumpAndPush(control.tags, control.bumpType, control.flags)
  } catch (error) {
    console.log(error)
    fail(error)
  }

  // Create release
  try {
    control.release = await createRelease(control.gitAuth, control.flags, control.repoDetails, control.bump, control.changelog)
  } catch (error) {
    if (error.response.status === 403) { // token does not have access to what it needs to (e.g organization)
      try {
        control.gitAuth = await requestToken(true, control.repoDetails) // re-authenticate
        createSpinner('Creating release')
        control.release = await createRelease(control.gitAuth, control.flags, control.repoDetails, control.bump, control.changelog)
      } catch (error) {
        fail(error)
      }
    }
    fail(error)
  }

  if (global.spinner) global.spinner.succeed()
  global.spinner = false

  try {
    await sleep(500) // wait for Github to render the release
    if (!control.flags.showUrl) {
      open(control.release, {wait: false})
      console.log(`\n${chalk.bold('Done!')} Opened release in browser...`)
    } else {
      console.log(`\n${chalk.bold('Done!')} ${control.release}`)
    }
  } catch (error) {
    fail(error)
  }
}

// Let the firework start
main()
