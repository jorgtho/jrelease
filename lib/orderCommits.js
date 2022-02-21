// Packages
const chalk = require('chalk')
const inquirer = require('inquirer')
const semVer = require('semver')

// Util
const getChoices = require('./choices')
const changeTypes = require('./changeTypes')
const definitions = require('./definitions')

module.exports = async (commits, tags, flags) => {
    const questions = []
    const predefined = {}
  
    const choices = getChoices(changeTypes, tags)
  
    // Show the latest changes first
    commits.all.reverse()
  
    for (const commit of commits.all) {
      const defTitle = definitions.type(commit.title, changeTypes)
      const defDescription = definitions.type(commit.description, changeTypes)
  
      const definition = defTitle || defDescription
  
      // Firstly try to use the commit title
      let message = commit.title
  
      // If it wasn't set, try the description
      if (message.length === 0) {
        const lines = commit.description.split('\n')
  
        for (let line of lines) {
          if (!line) {
            continue
          }
  
          line = line.replace('* ', '')
  
          if (line.length === 0) {
            continue
          }
  
          const questionExists = questions.find(question => question.message === line)
  
          if (questionExists) {
            continue
          }
  
          if (line.length > 1) {
            message = line
            break
          }
        }
      }
  
      // If for some reason the message is still not defined,
      // don't include it in the list
      if (message.length === 0) {
        continue
      }
  
      // If a type preset was found, don't include it
      // in the list either
      if (definition) {
        predefined[commit.hash] = {
          type: definition,
          message
        }
        continue
      }

      // If message is simply a tag-commit (semver), don't include it
      if (semVer.valid(message)) {
        continue
      }
  
      // If we are skipping the questions, don't let them be included
      // in the list
      if (flags.skipQuestions) {
        predefined[commit.hash] = {
          // The type doesn't matter since it is not included in the
          // final changelog
          type: 'patch',
          message
        }
  
        continue
      }
  
      questions.push({
        name: commit.hash,
        message,
        type: 'list',
        choices
      })
    }
    // By default, nothing is there yet
    let answers = {}
  
    if (choices && questions.length > 0) {
      console.log(`${chalk.green('!')} Please enter the type of change for each commit:\n`)
      answers = await inquirer.prompt(questions)
  
      for (const answer in answers) {
        if (!{}.hasOwnProperty.call(answers, answer)) {
          continue
        }
  
        const type = answers[answer]
        const { message } = questions.find(question => question.name === answer)
  
        answers[answer] = {
          type,
          message
        }
      }
    }
    const results = Object.assign({}, predefined, answers)
    return results
}