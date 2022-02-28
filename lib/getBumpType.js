const changeTypes = require('./changeTypes')
const chalk = require('chalk')

module.exports = (bumpType) => {
  const bumps = bumpType.length

  if (bumps === 0) {
    throw new Error('No version type specified. Use command "jrelease <SemVerType>". (SemVer-compatible types: "major", "minor", "patch", "premajor", "preminor", "prepatch", "pre")')
  }
  if (bumps === 1) {
    const bump = (bumpType[0].toLowerCase() === 'pre') ? 'prerelease' : bumpType[0].toLowerCase()
    const isPre = bump.startsWith('pre')
    const allowedTypes = []
    for (const type of changeTypes) {
      allowedTypes.push(type.handle)
    }
    const allowed = allowedTypes.includes(bump)
    if (!allowed) {
      throw new Error(`${chalk.yellow(bump)} is not a valid SemVerType. Use command "jrelease <SemVerType>". (SemVer-compatible types: "major", "minor", "patch", "premajor", "preminor", "prepatch", "pre")`)
    } else {
      return ({ bumpType: bump, isPre })
    }
  } else {
    throw new Error('Use command "jrelease <SemVerType>". (SemVer-compatible types: "major", "minor", "patch", "premajor", "preminor", "prepatch", "pre")')
  }
}
