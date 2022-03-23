// Packages
const inquirer = require('inquirer')
const { stopSpinner } = require('./spinner')
const semVer = require('semver')

module.exports = async (releases, tags, details) => {
  if (tags.length === 0 || tags[0].name === '0.0.0') return {hash: false, tag: '0.0.0'} // No releases or previous tags - initial release
  
  const releasesOnBranch = releases.all.filter(r => r.target_commitish === details.currentBranch)

  const latestRelease = releasesOnBranch.find(r => !r.prerelease && !r.draft)
  const latestPrerelease = releasesOnBranch.find(r => r.prerelease && !r.draft)

  // Why did I do it this way???
  const latestReleaseTag = (latestRelease) ? tags.find(tag => tag.name === latestRelease.tag_name) : false
  const latestPrereleaseTag = (latestPrerelease) ? tags.find(tag => tag.name === latestPrerelease.tag_name) : false
  const latestReleaseHash = (latestReleaseTag) ? latestReleaseTag.commit.sha : false
  const latestPrereleaseHash = (latestPrereleaseTag) ? latestPrereleaseTag.commit.sha : false

  if (!latestReleaseHash && !latestPrereleaseHash) return {hash: false, tag: '0.0.0'} // No releases - this is initial release for this branch

  let choices = []

  if (latestPrerelease && latestRelease) {
    if (semVer.gt(latestPrerelease.tag_name, latestRelease.tag_name)) { // If there is a prerelease with a later tag than the stable release
      choices.push({
        name: ` From latest stable release: ${latestRelease.tag_name}`,
        value: {hash: latestReleaseHash, tag: latestRelease.tag_name},
        short: `(Latest release tag: ${latestPrerelease.tag_name})`
      })
      choices.push({
        name: ` From latest pre-release: ${latestPrerelease.tag_name}`,
        value: {hash: latestPrereleaseHash, tag: latestPrerelease.tag_name},
        short: `(Latest pre-release tag: ${latestPrerelease.tag_name})`
      })
    } else {
      return {hash: latestReleaseHash, tag: latestRelease.tag_name}
    }
  } else if (!latestRelease && latestPrerelease) {
    choices.push({
      name: ` From first commit`,
      value: {hash: false, tag: '0.0.0'},
      short: `(First commit)`
    })
    choices.push({
      name: ` From latest pre-release: ${latestPrerelease.tag_name}`,
      value: {hash: latestPrereleaseHash, tag: latestPrerelease.tag_name},
      short: `(Latest pre-release tag: ${latestPrerelease.tag_name})`
    })
  } else {
    return {hash: latestReleaseHash, tag: latestRelease.tag_name}
  }

  const questions = [
    {
      name: 'Choose tag',
      message: `Where would you like to start the changelog from?`,
      type: 'list',
      choices
    }
  ]
  // By default, nothing is there yet
  let answers = {}

  // Stop spinner
  stopSpinner()
  console.log('')

  answers = await inquirer.prompt(questions)

  console.log('')

  return answers[questions[0].name]
}
