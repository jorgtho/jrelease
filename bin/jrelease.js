#!/usr/bin/env node

// Packages
const nodeVersion = require('node-version')
const { red } = require('chalk')
const chalk = require('chalk')
const args = require('args')
const open = require('open')
const checkForUpdate = require('update-check')

// Utilities
const { getRepo, getReleases } = require('../lib/repo')
const { connect, requestToken } = require('../lib/connect')
const { fail, create: createSpinner } = require('../lib/spinner')
const { bumpVersion } = require('../lib/bump')
const pkg = require('../package')
const sleep = require('../lib/sleep')
const changeTypes = require('../lib/changeTypes')
const collectChanges = require('../lib/changes')
const { createRelease, getReleaseURL } = require('../lib/release')
const orderCommits = require('../lib/orderCommits')
const { getTags } = require('../lib/tags')
const getCommits = require('../lib/commits')
const chooseTag = require('../lib/chooseTag')
const listCommits = require('../lib/listCommits')

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(`${red('Error!')} Now requires at least version 6 of Node. Please upgrade!`)
  process.exit(1)
}

// Control of values used here and there
const config = {
  flags: false,
  gitAuth: false,
  repoDetails: false,
  tags: false,
  bumpType: false,
  bumpVersion: false,
  releaseRes: false,
  changes: false,
  commits: false,
  existingId: false
}

args.option('pre', 'Mark the release as prerelease')
  .option('pre-suffix', 'Provide a suffix for a prerelease, "canary" is used as defualt')
  .option('publish', 'Instead of creating a draft, publish the release')
  .option(['H', 'hook'], 'Specify a custom file to pipe releases through')
  .option(['t', 'previous-tag'], 'Specify previous release', '')
  .option(['u', 'show-url'], 'Show the release URL instead of opening it in the browser')
  .option(['s', 'skip-questions'], 'Skip the questions and create a simple list without the headings')
  .option(['l', 'list-commits'], 'Only lists commits since previous release (does not change anything)')

config.flags = args.parse(process.argv)

// check if pre-release
if (args.sub[0] === 'pre') {
  config.flags.pre = true
}

const main = async () => {
  // const update = await checkForUpdate(pkg);
  const update = false

  if (update) {
    console.log(`${chalk.bgRed('UPDATE AVAILABLE')} The latest version of \`jrelease\` is ${update.latest}`)
  }

  if (config.flags.listCommits) {
    createSpinner('Getting commits since last release')
    try {
      await listCommits(config.flags)
      process.exit(1)
    } catch (error) {
      console.log(error)
      fail(error)
      process.exit(1)
    }
  }

  const bumpType = args.sub
  const argAmount = bumpType.length

  if (argAmount === 0) {
    fail(`No version type specified. Use command "jrelease <SemVerType>". (SemVer-compatible types: "major", "minor", "patch") \n Use ${chalk.yellow('-h')} or ${chalk.yellow('help')} for more options`)
  }

  if (argAmount === 1 || (bumpType[0] === 'pre' && argAmount === 2)) {
    const allowedTypes = []

    for (const type of changeTypes) {
      allowedTypes.push(type.handle)
    }

    const allowed = allowedTypes.includes(bumpType[0])
    config.bumpType = bumpType[0]

    if (!allowed) {
      fail('Version type not SemVer-compatible ("major", "minor", "patch")')
    }
  }

  createSpinner('Authenticating with github')
  try {
    config.gitAuth = await connect(config.flags.showUrl)
  } catch (error) {
    fail(error)
    process.exit(1)
  }

  createSpinner('Fetching repo info')
  try {
    config.repoDetails = await getRepo(config.gitAuth)
  } catch (error) {
    console.log(error)
    fail(error)
    process.exit(1)
  }

  createSpinner('Fetching release info')
  try {
    const releases = await getReleases(config.gitAuth, config.repoDetails)
    config.releaseRes = releases.all
    config.latestRelease = releases.latest
    if (config.flags.previousTag.length === 0) {
      config.tags = await getTags({ previousTag: config.flags.previousTag })
      if (config.tags.length > 1 && config.latestRelease && config.latestRelease.tag_name !== config.tags[0].tag) { // Check if latest release tag is older than latest commit tag
        global.spinner.succeed()
        global.spinner = false
        // const { newVersion } = await getNewVersion(config.bumpType, bumpType[1])
        const useReleaseTag = await chooseTag(config.latestRelease.tag_name, config.tags[0].tag) // Ask user to choose which tag to start changelog from
        if (useReleaseTag) config.flags.previousTag = useReleaseTag // set previuos tag as the latest release tag
      }
    }
  } catch (error) {
    console.log(error)
    fail(error)
    process.exit(1)
  }

  createSpinner(`Bumping version: ${config.bumpType}`)
  try {
    config.bumpVersion = await bumpVersion(config.bumpType, config.flags.preSuffix, config.flags.pre)
  } catch (error) {
    fail(error)
    process.exit(1)
  }

  createSpinner('Getting tags')
  try {
    config.tags = await getTags({ previousTag: config.flags.previousTag })
  } catch (error) {
    fail(error)
    process.exit(1)
  }

  createSpinner('Checking if release already exists')

  if (!config.releaseRes) {
    fail("Couldn't check if release exists.")
  }

  let existingRelease = null
  for (const release of config.releaseRes) {
    if (release.tag_name === config.tags[0].tag) {
      existingRelease = release
      config.existingId = existingRelease.id
      break
    }
  }

  if (!existingRelease) {
    try {
      config.changes = await collectChanges(config.tags)
    } catch (error) {
      fail(error)
      process.exit(1)
    }
  } else if (config.flags.overwrite) {
    global.spinner.text = 'Overwriting release, because it already exists'
    try {
      config.changes = await collectChanges(config.tags, config.existingId)
    } catch (error) {
      fail(error)
      process.exit(1)
    }
  } else {
    global.spinner.succeed()
    console.log('')

    const releaseURL = getReleaseURL(existingRelease)
    const prefix = `${chalk.red('Error!')} Release already exists`

    if (!config.flags.showUrl) {
      try {
        open(releaseURL, { wait: false })
        console.error(`${prefix}. Opened in browser...`)

        return
        // eslint-disable-next-line no-empty
      } catch (err) {}
    }

    console.error(`${prefix}: ${releaseURL}`)
    process.exit(1)
  }

  createSpinner('Getting commits')
  try {
    config.commits = await getCommits(config.tags)
  } catch (error) {
    fail(error)
    process.exit(1)
  }
  global.spinner.succeed()

  // Prevents the spinner from getting succeeded
  // again once new spinner gets created
  global.spinner = false

  try {
    config.order = await orderCommits(config.commits, config.tags, config.flags)
  } catch (error) {
    fail(error)
    process.exit(1)
  }
  // Update spinner status
  console.log('')

  createSpinner('Creating release')
  try {
    config.releaseUrl = await createRelease(config.tags[0], config.existingId, config.commits, config.order, config.gitAuth, config.flags, config.repoDetails)
  } catch (error) {
    if (error.response.status === 403) {
      global.spinner.stop()
      global.spinner = false
      console.log(`\n${chalk.red('!')} '${config.repoDetails.user}' has OAuth App access restriction, follow instructions below to give access`)
      console.log(`\n${chalk.yellow('!')} If '${config.repoDetails.user}' is an organization, remember to grant access to it`)
      try {
        config.gitAuth = await requestToken(config.flags.showUrl)
      } catch (error) {
        fail(error)
        process.exit(1)
      }
      try {
        createSpinner('Creating release')
        config.releaseUrl = await createRelease(config.tags[0], config.existingId, config.commits, config.order, config.gitAuth, config.flags, config.repoDetails)
      } catch (error) {
        console.log(error.response)
        fail(error)
        process.exit(1)
      }
    } else {
      console.log(error.response)
      fail(error)
      process.exit(1)
    }
  }
  global.spinner.succeed()
  global.spinner = false

  // Wait for the GitHub UI to render the release
  await sleep(500)

  if (!config.flags.showUrl) {
    try {
      open(config.releaseUrl, { wait: false })
      console.log(`\n${chalk.bold('Done!')} Opened release in browser...`)

      return
      // eslint-disable-next-line no-empty
    } catch (err) {}
  }
  console.log(`\n${chalk.bold('Done!')} ${config.releaseUrl}`)
}

// Let the firework start
main()
