#!/usr/bin/env node

'use strict'
var path = require('path')
var Liftoff = require('liftoff')
var yargs = require('yargs')
var Build = require('markscript-core').Build
var fs = require('fs')
var Server = require('markscript-koa').Server
var u = require('uservices')

var cli = new Liftoff({
  name: 'msp',
  configName: 'markscriptfile',
  extensions: {
    '.ts': null,
    '.js': null
  }
})

cli.launch({}, function (env) {
  if (!env.configPath) {
    console.error('markscriptfile.{js,ts} not found')
    process.exit(1)
  }

  process.chdir(env.cwd)

  var yargs = require('yargs')
    .usage('Build your MarkScript project.\nUsage: msp <command>')
    .command('init', 'Initialise a new MarkScript project')
    .command('create', 'Create the server and databases')
    .command('delete', 'Delete the server and databases')
    .command('deploy', 'Deploy the assets to the server and databases')
    .command('undeploy', 'Remove the assets from the server and databases')
    .command('run', 'Run the test server')
    .command('task <taskName>', 'Run a task on the test server')
    // **************** DO NOT REMOVE ****************
    // TODO: Support chaining of commands
    // .command('build', 'Create then deploy')
    // .command('redeploy', 'Undeploy then deploy')
    // .command('rebuild', 'Delete then build')
    .demand(1)
    .help('help')
    .version(function(){
      return p.getPackageJson(env.cwd).version
    })
  var argv = yargs.argv

  var cmd = argv._[0]

  if (env.configPath.substring(env.configPath.length - 3) === '.ts') {
    require('./rts')
  }

  var buildFile = require(env.configPath)

  buildFile.buildOptions.pkgDir = env.cwd
  var build = new Build(buildFile.buildOptions)
  switch (cmd) {
    case 'init':
      init()
      break
    case 'writeModel':
      writeModel()
      break
    case 'create':
      create()
      break
    case 'remove':
      remove()
      break
    case 'deploy':
      deploy()
      break
    case 'undeploy':
      undeploy()
      break
    case 'run':
      run()
      break
    case 'task':
      task(argv._[1])
    // **************** DO NOT REMOVE ****************
    // TODO: Support chaining of commands
    // case 'redeploy':
    //   redeploy()
    //   break
    // case 'build':
    //   _build()
    //   break
    // case 'rebuild':
    //   rebuild()
    //   break
    break
    default:
      console.log('Unrecognised command: ' + cmd)
      console.log('')
      yargs.showHelp()
  }

  function init() {
    // TODO
  }

  function writeModel() {
    build.writeModel()
  }

  function create() {
    return build.createDatabase().then(function() {
      console.log('Successfully created database')
    }).catch(function(e) {
      console.log(e)
      console.log(e.stack)
    })
  }

  function remove() {
    build.buildModel()
    return build.removeDatabase().then(function() {
      console.log('Successfully remove database')
    }).catch(function(e) {
      console.log(e)
      console.log(e.stack)
    })
  }

  function deploy() {
    return build.deployAssets().then(function() {
      build.writeModel()
      console.log('Successfully deployed database code')
    }).catch(function(e) {
      console.log(e)
      console.log(e.stack)
    })
  }

  function undeploy() {
    return build.undeployAssets().then(function() {
      console.log('Successfully undeployed database code')
      return true
    }).catch(function(e) {
      console.log(e)
      console.log(e.stack)
    })
  }

  function run() {
    var runOptions = buildFile.runOptions
    var server = new Server({
      database: {
        databaseName: runOptions.database.name,
        host: runOptions.database.host,
        port: runOptions.database.port,
        user: runOptions.database.user,
        password: runOptions.database.password
      },
      middle: {
        host: runOptions.middle.host,
        port: runOptions.middle.port
      },
      serviceSpecs: fs.existsSync('./deployed/service-specs.json') ? u.parse(fs.readFileSync('./deployed/service-specs.json').toString()) : undefined,
      fileServerPath: runOptions.middle.fileServerPath
    })
    return server.start()
  }

  function task(task) {
    return run().then(function(server){
      return buildFile.tasks[task](server)
    }).catch(function(e){
      console.log(e)
      console.log(e.stack)
      return e
    })
  }
})
