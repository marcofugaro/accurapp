const path = require('path')
const spawn = require('cross-spawn')
const fs = require('fs-extra')
const chalk = require('chalk')
const figlet = require('figlet')
const boxen = require('boxen')
const outdent = require('outdent')
const filesize = require('filesize')
const gzipSize = require('gzip-size').sync
const indentString = require('indent-string')
const columnify = require('columnify')

const log = {
  ok(...a) {
    console.log(`::: ${chalk.yellow(...a)}`)
  },
  warn(...a) {
    console.error(`!!! ${chalk.yellow(...a)}`)
  },
  err(...a) {
    console.error(`!!! ${chalk.red(...a)}`)
  },
  info(...a) {
    console.log(`--- ${chalk.blue(...a)}`)
  },
}

function abort(message, errno = 1) {
  console.log()
  log.err(message)
  log.err(`Aborting.`)
  process.exit(1)
}

function exec(command, dir) {
  if (!dir) throw new Error(`Function exec called without directory.`)

  const [executable, ...args] = Array.isArray(command) ? command : command.split(' ')
  const proc = spawn.sync(executable, args, {
    stdio: 'inherit',
    cwd: dir,
  })
  if (proc.status !== 0) {
    abort(`Command '${chalk.cyan(command)}' failed with error: "${proc.error}"`)
  }
  if (proc.signal !== null) {
    abort(`Command '${chalk.cyan(command)}' exited with signal: "${proc.signal}"`)
  }
}

function coloredBanner(text, colors = ['blue', 'red']) {
  // If the console is small, we show only the logo
  if (text.includes(' accurapp') && process.stdout.columns < 125) {
    text = text.slice(0, -' accurapp'.length)
  }

  const bannerText = text.replace(/\|/g, 'l') // In BigMoney font, 'l' (lowercase L) are much nicer than '|' (pipes)
  const bannerColors = {
    $: colors[0],
    _: colors[1],
    '|': colors[1],
    '\\': colors[1],
    '/': colors[1],
  }
  const banner = figlet.textSync(bannerText, { font: 'Big Money-nw' })
  const colored = banner.replace(/[^\s]/g, (c) => chalk[bannerColors[c] || 'white'](c))
  return `\n${colored}`
}

function yellowBox(message) {
  const boxenOptions = {
    padding: 1,
    align: 'center',
    borderColor: 'yellow',
  }

  return boxen(message, boxenOptions)
}

function createOutdatedMessage(outdatedDeps, latestDeps) {
  const outdatedMessages = outdatedDeps.map((dep, i) => {
    const updatedDep = latestDeps.find((latestDep) => latestDep.name === dep.name)
    return `${chalk.blue(dep.name)} ${chalk.gray(dep.version)} → ${chalk.green(updatedDep.version)}`
  })

  return outdent`
    ${chalk.yellow('Hey, an update for accurapp is available!')}
    ${outdatedMessages.join('\n')}
    ${chalk.yellow('Run')} ${chalk.cyan('yarn upgrade-interactive --latest')} ${chalk.yellow(
    'to update'
  )}
  `
}

function indent(text, prepend = '  ', firstLinePrepend = prepend) {
  return text
    .split(`\n`)
    .map((line, i) => `${i === 0 ? firstLinePrepend : prepend}${line}`)
    .join(`\n`)
}

function listLine(text, color = (i) => i) {
  return indent(text, '   ', color('\n • '))
}

function printFileSizes(webpackStats, appBuild, maxBundleGzipSize = 1024 * 1024) {
  const assets = (webpackStats.stats || [webpackStats])
    .map((stats) =>
      stats
        .toJson({ all: false, assets: true })
        .assets.filter((asset) => /\.(js|css)$/.test(asset.name))
        .map((asset) => {
          const file = path.join(appBuild, asset.name)

          // Maybe some files are in a subfolder
          if (!fs.existsSync(file)) {
            return
          }

          const fileContents = fs.readFileSync(file)
          const size = fs.statSync(file).size
          const sizeGzip = gzipSize(fileContents)

          return {
            folder: path.join(path.basename(appBuild), path.dirname(asset.name)),
            name: path.basename(asset.name),
            size,
            sizeGzip,
          }
        })
        .filter(Boolean)
    )
    .reduce((single, all) => all.concat(single), [])

  // sort by name
  assets.sort((a, b) => {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    }

    return 0
  })

  const isLarge = (asset) => path.extname(asset.name) === '.js' && asset.size > maxBundleGzipSize

  const columnData = assets.reduce((columnObj, asset) => {
    const sizeLabel = `${filesize(asset.size)} ${chalk.dim(
      `(${filesize(asset.sizeGzip)} gzipped)`
    )}`
    const firstColumn = `${chalk.dim(`${asset.folder}${path.sep}`)}${chalk.cyan(asset.name)}`
    const secondColumn = isLarge(asset) ? chalk.yellow(sizeLabel) : sizeLabel

    columnObj[firstColumn] = secondColumn
    return columnObj
  }, {})

  console.log(
    indentString(
      columnify(columnData, {
        showHeaders: false,
        columnSplitter: '   ',
      }),
      3
    )
  )

  if (assets.some(isLarge)) {
    console.log()
    console.log(
      chalk.yellow(outdent`
      The bundle size is significantly larger than recommended.
      Consider reducing it with code splitting: https://goo.gl/9VhYWB
      You can also analyze the project dependencies: https://goo.gl/sDmR4n
    `)
    )
  }
}

module.exports = {
  log,
  abort,
  exec,
  coloredBanner,
  yellowBox,
  createOutdatedMessage,
  indent,
  listLine,
  printFileSizes,
}
