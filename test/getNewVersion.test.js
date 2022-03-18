const { getNewVersion } = require('../lib/bumpAndPush')

const base = {
  preSuffix: 'canary',
  localTags: [
    '2.2.2',
    '2.1.1',
    '1.0.1',
    '1.0.0'
  ]
}

const test1 = {
  ...base,
  desc: 'When previous tag is the latest tag, and bumptype is major',
  prevTag: '2.2.2',
  bumpType: 'major',
  expect: {
    newVersion: '3.0.0',
    alreadyExists: false
  }
}

const test2 = {
  ...base,
  desc: 'When the new tag already exists locally is and bumptype is major',
  prevTag: '2.2.2',
  localTags: ['3.0.0'],
  bumpType: 'major',
  expect: {
    newVersion: '4.0.0',
    alreadyExists: '3.0.0'
  }
}

const test3 = {
  ...base,
  desc: 'When previous tag is the latest tag, and bumptype is preminor',
  prevTag: '2.2.2',
  bumpType: 'preminor',
  expect: {
    newVersion: '2.3.0-canary.0',
    alreadyExists: false
  }
  
}

const test4 = {
  ...base,
  desc: 'When the new tag already exists locally is and bumptype is premajor',
  prevTag: '2.2.2',
  localTags: ['3.0.0-canary.0'],
  bumpType: 'premajor',
  expect: {
    newVersion: '4.0.0-canary.0',
    alreadyExists: '3.0.0-canary.0'
  }
}

const test5 = {
  ...base,
  desc: 'When the previous tag was "0.0.0"',
  prevTag: '0.0.0',
  localTags: [],
  bumpType: 'patch',
  expect: {
    newVersion: '1.0.0',
    alreadyExists: false
  }
}

const tests = [test1, test2, test3, test4, test5]

describe('New version is returned correct,', () => {
  tests.forEach(tst => {
    test(tst.desc, () => {
      const newVersion = getNewVersion(tst.prevTag, tst.localTags, tst.bumpType, tst.preSuffix)
      expect(newVersion.newVersion).toBe(tst.expect.newVersion)
      expect(newVersion.alreadyExists).toBe(tst.expect.alreadyExists)
    })
  })
})
