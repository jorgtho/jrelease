const getBumpType = require('../lib/getBumpType')
const changeTypes = require('../lib/changeTypes')

const faultyInputs = [
  {
    input: ['blabla'],
    desc: 'When input is one element, but not valid'
  },
  {
    input: ['blabla', 'minor'],
    desc: 'When input is two elements, one is not valid'
  },
  {
    input: ['major', 'minor'],
    desc: 'When input is two elements, both are valid'
  },
  {
    input: ['blabla', 'blublublub'],
    desc: 'When input is two elements, none are valid'
  },
  {
    input: [],
    desc: 'When input is empty'
  }
]

describe('Valid changetypes are returned correct', () => {
  changeTypes.forEach(type => {
    test(`When ${type.handle} is input`, () => {
      const { bumpType } = getBumpType([type.handle])
      expect(bumpType).toBe(type.handle)
    })
    test(`When ${type.handle.toUpperCase()} is input`, () => {
      const { bumpType } = getBumpType([type.handle.toUpperCase()])
      expect(bumpType).toBe(type.handle)
    })
  })
})

describe('Invalid changetypes throws error', () => {
  faultyInputs.forEach(faultyInput => {
    test(faultyInput.desc, () => {
      const fn = () => getBumpType(faultyInput.input)
      expect(fn).toThrow()
    })
  })
})
