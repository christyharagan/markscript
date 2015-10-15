#!/usr/bin/env node

import * as path from 'path'
import * as fs from 'fs'
import * as Build from '../lib/build'
import {coreBuildPlugin} from '../lib/coreBuildPlugin'
import * as p from 'typescript-package'
import * as Yargs from 'yargs'
import * as os from 'os'
import * as ts from 'typescript'

var chalk = require("chalk")
var sanitize = require("sanitize-filename")
let Liftoff = require('liftoff')

let cli = new Liftoff({
  name: 'markscript',
  configName: 'markscriptfile',
  extensions: {
    '.ts': null,
    '.js': null
  }
})

cli.launch({}, function(env) {
  let yargs = Yargs
    .usage('Build your MarkScript project.\nUsage: markscript <task>')
    .demand(1)
    .command('init', 'Initialise a new MarkScript project')
    .help('help')
    .version(p.getPackageJson(env.cwd).version)
  let argv = yargs.argv
  let taskName = argv._[0]

  if (taskName === 'init') {
    // TODO
    console.log('TODO - Sorry ;)')
    process.exit(1)
  }

  if (!env.configPath) {
    console.error('markscriptfile.{js,ts} not found')
    process.exit(1)
  }

  let buildFile: MarkScript.Build = require(env.configPath).build
  if (!buildFile) {
    console.error('markscriptfile should export a const value called "build" of type MarkScript.Build')
    process.exit(1)
  }

  let plugins: Build.BuildModelPlugin<any, any>[] = [coreBuildPlugin]
  if (buildFile.plugins) {
    plugins = plugins.concat(buildFile.plugins)
  }
  let pkgDir = buildFile.pkgDir || env.cwd

  process.chdir(pkgDir)

  let isTypeScript = env.configPath.substring(env.configPath.length - 3) === '.ts'

  let build = new Build.Build({
    buildConfig: buildFile.buildConfig,
    plugins: plugins,
    pkgDir: pkgDir,
    buildModelPersistanceFolder: buildFile.buildModelPersistanceFolder,
    isTypeScript: isTypeScript,
    runtime: buildFile.runtime,
    tasks: buildFile.tasks
  })

  Object.keys(build.tasks).forEach(function(taskName) {
    yargs.command(taskName, build.tasks[taskName].description)
  })

  if (isTypeScript) {
    // The code in this IF block is derived from the typescript-register
    // (https://github.com/pspeter3/typescript-register) project:

    // The MIT License (MIT)

    // Copyright (c) 2015 Phips Peter

    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:

    // The above copyright notice and this permission notice shall be included in all
    // copies or substantial portions of the Software.

    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    // SOFTWARE.
    
    let sanitizeOptions = {
      replacement: "_"
    }
    let parts = process.cwd().split(path.sep).map(function(p) {
      return sanitize(p, sanitizeOptions)
    })
    let cachePath = path.join.apply(null, parts)
    let outDir = path.join(os.tmpdir(), 'markscript-to-typescript', cachePath)

    var options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      rootDir: '.',
      outDir: outDir,
      target: ts.ScriptTarget.ES5,
      moduleResolution: ts.ModuleResolutionKind.NodeJs
    }

    function compile(filename, options) {
      var program = ts.createProgram([filename], options)
      var emitResult = program.emit()
      var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)

      if (allDiagnostics.length > 0) {
        allDiagnostics.forEach(function(diagnostic) {
          var position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
          console.error(chalk.bgRed(String(diagnostic.code)), chalk.grey(`${diagnostic.file.fileName}, (${position.line}, ${position.character})`), diagnostic.messageText)
        })
        throw new Error('TypeScript Compilation Errors')
      }
    }

    function req(module, filename) {
      var relative = path.relative(path.join(process.cwd(), options.rootDir), path.dirname(filename))
      var basename = path.basename(filename, '.ts')
      var out = path.join(outDir, relative, basename + '.js')

      if (!fs.readFileSync(out) || (fs.statSync(out).mtime > fs.statSync(filename).mtime)) {
        compile(filename, options)
      }
      module._compile(fs.readFileSync(out, 'utf8'), filename)
    }
    require.extensions['.ts'] = req
  }

  build.runTasks(taskName)
})
