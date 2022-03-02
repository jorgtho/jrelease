const { htmlEscape } = require('escape-goat')
const changeTypes = require('./changeTypes')

module.exports = (orderedCommits) => {
    let mdText = ''
    if (orderedCommits.ifSkipQuestions.length > 0) { // Flag skip questions
        mdText += `### Changes \n\n`
        for (const commit of orderedCommits['ifSkipQuestions']) {
            mdText += `- ${htmlEscape((commit.subject.trim() !== '') ? commit.subject : commit.body)}: ${commit.hash}\n` // escape title, because markdown
        }
        mdText += '\n' // Done with type - add newline
        return mdText
    }
    for (const type in orderedCommits) {
        if (orderedCommits[type].length > 0) {
            mdText += `### ${changeTypes.find(t => t.handle === type).pluralName} \n\n`
            for (const commit of orderedCommits[type]) {
                mdText += `- ${htmlEscape((commit.subject.trim() !== '') ? commit.subject : commit.body)}: ${commit.hash}\n` // escape title, because markdown
            }
            mdText += '\n' // Done with type - add newline
        }
    }
    return mdText
}