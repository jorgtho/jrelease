module.exports = [
  {
    handle: 'major',
    name: 'Major Change',
    pluralName: 'Major Changes',
    short: 'Major',
    description: 'incompatible API change',
    includeQuestions: ['major', 'minor', 'patch']
  },
  {
    handle: 'minor',
    name: 'Minor Change',
    pluralName: 'Minor Changes',
    short: 'Minor',
    description: 'backwards-compatible functionality',
    includeQuestions: ['minor', 'patch']
  },
  {
    handle: 'patch',
    name: 'Patch',
    short: 'Patch',
    pluralName: 'Patches',
    description: 'backwards-compatible bug fix',
    includeQuestions: []
  },
  {
    handle: 'premajor',
    name: 'Major Change',
    short: 'Major',
    pluralName: 'Major Changes',
    description: 'incompatible API change',
    includeQuestions: ['major', 'minor', 'patch']
  },
  {
    handle: 'preminor',
    name: 'Minor Change',
    short: 'Minor',
    pluralName: 'Minor Changes',
    description: 'backwards-compatible functionality',
    includeQuestions: ['minor', 'patch']
  },
  {
    handle: 'prepatch',
    name: 'Patch',
    short: 'Patch',
    pluralName: 'Patches',
    description: 'backwards-compatible bug fix',
    includeQuestions: []
  },
  {
    handle: 'prerelease',
    name: 'Pre-release',
    short: 'Pre',
    pluralName: 'Pre-releases',
    description: 'Works as prepatch or increases pre-suffix',
    includeQuestions: []
  }
]
