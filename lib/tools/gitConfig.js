const fs = require('fs')
const chalk = require('chalk')
const { execSync } = require('child_process')

const parseGitconfig = (gitConfig) => {
  if (!fs.existsSync(gitConfig)) throw new Error(`${chalk.red(gitConfig)} does not exist - make sure you are in a Git repo, as well as being synced with remote`)
  const config = {}
  let currentProp = 'unknownProp'
  const confLines = fs.readFileSync(gitConfig, 'utf8').split(/\r?\n/)
  for (const confLine of confLines) {
    const line = confLine.trim()
    const lineList = line.split('=')
    if (line.startsWith('[') && line.endsWith(']')) {
      currentProp = line.replace('[', '').replace(']', '').trim()
      if (currentProp in config) throw new Error(`${chalk.red(currentProp)} is defined more than one time in your gitconfig - whyy?`)
      config[currentProp] = {}
    } else {
      if (lineList.length == 2) {
        if (currentProp === 'unknownProp') throw new Error(`${chalk.red(line)} is defined in gitconfig before a config property, gitconfig is not set correctly`)
        const prop = lineList[0].trim()
        const val = lineList[1].trim()
        if (prop in config[currentProp] && config[currentProp][prop] !== val) throw new Error(`${chalk.red(prop)} is defined more than one time ${chalk.red(currentProp)} with different values in your gitconfig - whyy?`)
        config[currentProp][prop] = val
      } else if (/\S/.test(line)) throw new Error(`${chalk.red(line)} is weird, and cannot be parsed from your gitconfig`)
    }
  }
  return config
}

const getRepoDetails = (gitConfig) => {
  const config = parseGitconfig(gitConfig)
  if (!('remote "origin"' in config)) throw new Error(`${chalk.red('remote "origin"')} is missing from git-config, make sure your repo is also hosted remote`)
  if (!('url' in config['remote "origin"'])) throw new Error(`${chalk.red('[remote "origin"].url')} is missing from git-config, make sure your repo is also hosted remote`)

  // Get repo owner and repo name from config-remote-url
  const urlList = config['remote "origin"'].url.split('/')
  if (urlList.length < 4) throw new Error(`${chalk.red(config['remote "origin"'].url)} is not a regular git-repo url, this is not supported`)
  if (!urlList.includes('github.com')) throw new Error(`${chalk.red(config['remote "origin"'].url)}. jRelease only supports repos hosted at github.com`)
  let repoName = urlList.pop()
  if (repoName.includes('.git')) repoName = repoName.replace('.git', '')
  const repoOwner = urlList.pop()

  // Get name of branch
  const currentBranch = runAndReturnGitCommand('git rev-parse --abbrev-ref HEAD').trim()

  return { repoName, repoOwner, currentBranch }
}

const runAndReturnGitCommand = command => {
  try {
    const res = execSync(command)
    return res.toString()
  } catch (err) {
    if (err.message.includes('Not a git repository')) {
      throw new Error('Directory is not a Git repository')
    }
    throw err
  }
}

module.exports = { parseGitconfig, getRepoDetails, runAndReturnGitCommand }
