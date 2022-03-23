const { htmlEscape } = require('escape-goat')
const changeTypes = require('./changeTypes')

module.exports = (orderedCommits, fromTagHash) => {
    let mdText = ''
    if (!fromTagHash) {
        mdText = 'Initial release'
        return mdText
    }
    if (orderedCommits.ifSkipQuestions.length > 0) { // Flag skip questions = true
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
    if (mdText.trim().length === 0) mdText = 'No changes since previous release'

    return mdText
}