#!/usr/bin/env node

import * as path from 'path'
import * as fs from 'fs'
import * as Build from '../lib/build'
import {coreBuildPlugin} from '../lib/coreBuildPlugin'
import * as p from 'typescript-package'
import * as Yargs from 'yargs'
import * as os from 'os'
import * as ts from 'typescript'

let cwd = process.cwd()
let markscriptFile: string
let isTypeScript: boolean
if (fs.existsSync(path.join(cwd, 'markscriptfile.ts'))) {
  markscriptFile = path.join(cwd, 'markscriptfile.ts')
  isTypeScript = true
} else if (fs.existsSync(path.join(cwd, 'markscriptfile.js'))) {
  markscriptFile = path.join(cwd, 'markscriptfile.js')
  isTypeScript = false
}

let yargs = Yargs
  .usage('Build your MarkScript project.\nUsage: markscript <task>')
  .demand(1)
  .command('init', 'Initialise a new MarkScript project')
  .help('help')
  .version(p.getPackageJson(cwd).version)

let build: Build.Build

if (markscriptFile) {
  if (isTypeScript) {
    let options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES5,
      moduleResolution: ts.ModuleResolutionKind.Classic
    }

    function req(module, filename) {
      module._compile(ts.transpile(fs.readFileSync(filename).toString(), options), filename)
    }
    require.extensions['.ts'] = req
  }

  let buildFile: MarkScript.Build = require(markscriptFile).build
  if (!buildFile) {
    console.error('markscriptfile should export a const value called "build" of type MarkScript.Build')
    process.exit(1)
  }

  let plugins: Build.BuildModelPlugin<any, any>[] = [coreBuildPlugin]
  if (buildFile.plugins) {
    plugins = plugins.concat(buildFile.plugins)
  }
  let pkgDir = buildFile.pkgDir || cwd

  process.chdir(pkgDir)

  build = new Build.Build({
    buildConfig: buildFile.buildConfig,
    plugins: plugins,
    pkgDir: pkgDir,
    buildModelPersistanceFolder: buildFile.buildModelPersistanceFolder,
    isTypeScript: isTypeScript,
    runtime: buildFile.runtime,
    tasks: buildFile.tasks,
    buildModelPersistance: Build.BuildModelPersistance.NO_SOURCE
  })

  Object.keys(build.tasks).forEach(function(taskName) {
    yargs.command(taskName, build.tasks[taskName].description)
  })
}

let argv = yargs.argv
let taskName = argv._[0]

if (taskName === 'init') {
  // TODO
  console.log('TODO - Sorry ;)')
  process.exit(1)
}

build.runTasks(taskName).catch(function(e){
  if (e.stack) {
    console.error(e.stack)
  } else {
    console.error(e)
  }
  process.exit(1)
})
