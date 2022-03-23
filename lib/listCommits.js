const chalk = require('chalk')

module.exports = async (commits, tag) => {
  if (global.spinner) {
    global.spinner.succeed()
    global.spinner = false
  }

  //const transformed = commits.reduce((acc, {hash, ...x}) => { acc[hash] = x; return acc}, {})

  console.log('')
  console.log(`${chalk.bold('Commits since latest release')} ${chalk.yellow(tag)}${chalk.bold('. Newest commits first:')}`)
  console.log('')
  console.table(commits)
  /*
  for (const commit of commits) {
    console.log(`\t${chalk.green(commit.subject)} - ${commit.hash} - by ${chalk.blue(commit.author)} - ${commit.date}`)
  }
  console.log('')*/
}
