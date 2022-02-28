const chalk = require('chalk')
const { getRepo, getReleases } = require('../lib/repo')
const { connect, requestToken } = require('../lib/connect')
const changeTypes = require('../lib/changeTypes')
const collectChanges = require('../lib/changes')
const { getTags, runAndReturnGitCommand } = require('../lib/tags')
const getCommits = require('../lib/commits')

module.exports = async (flags) => {
  const config = { flags }
  config.gitAuth = await connect(config.flags.showUrl)
  config.repoDetails = await getRepo(config.gitAuth)
  const releases = await getReleases(config.gitAuth, config.repoDetails)
  config.releaseRes = releases.all
  config.latestRelease = releases.latest
  if (config.flags.previousTag.length === 0) {
    config.tags = await getTags({ previousTag: config.flags.previousTag })
    if (config.tags.length > 1 && config.latestRelease && config.latestRelease.tag_name !== config.tags[0].tag) { // Check if latest release tag is older than latest commit tag
      config.flags.previousTag = config.latestRelease.tag_name // set previuos tag as the latest release tag
    }
  }
  config.tags = await getTags({ previousTag: config.tags[0].tag })
  config.latestCommit = (await runAndReturnGitCommand('git log -n 1')).split('commit')[1].split('Author')[0].trim()
  config.commits = await getCommits([{ hash: config.latestCommit }, config.tags[0]])
  config.commits.all.push(config.commits.latest)
  // const commits = config.commits.all.map(commit => `${commit.title} - ${commit.hash} - by ${commit.author}`).reverse()
  const commits = config.commits.all.reverse()

  global.spinner.succeed()
  global.spinner = false
  console.log('')
  console.log(`${chalk.bold('Commits since latest tag')} ${chalk.yellow(config.tags[0].tag)}${chalk.bold('. Newest commits first:')}`)
  console.log('')
  console.log(commits)
  for (const commit of commits) {
    console.log(`\t${chalk.green(commit.title)} - ${commit.hash} - by ${chalk.blue(commit.author)}`)
  }
  console.log('')
}
