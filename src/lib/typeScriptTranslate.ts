import * as path from 'path'
import * as fs from 'fs'
import * as ts from 'typescript'

export function translateTypeScript(baseDir: string, relFiles:string[], outDir:string, tmpDir?:string) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }
  if (tmpDir && !fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir)
  }

  let compiledCode:{[relFiles:string]:string} = {}

  let options: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES5,
    moduleResolution: ts.ModuleResolutionKind.Classic,
    rootDir: baseDir,
    outDir: outDir
  }

  let jsRelFiles = []
  let compile = false
  let files = relFiles.map(function(relFile){
    if (relFile.substring(relFile.length - 5) !== '.d.ts') {
      let jsRelFile = relFile.substring(0, relFile.length - 3) + '.js'
      let jsFile = path.join(outDir, jsRelFile)
      let tsFile = path.join(baseDir, relFile)

      jsRelFiles.push(jsRelFile)

      if (!fs.existsSync(jsFile) || fs.statSync(tsFile).mtime >= fs.statSync(jsFile).mtime) {
        compile = true
      }

      if (tmpDir) {
        let file = path.join(tmpDir, relFile)
        if (!fs.existsSync(path.dirname(file))) {
          fs.mkdirSync(path.dirname(file))
        }
        fs.writeFileSync(file, removeDecorators(fs.readFileSync(tsFile).toString()))
        return file
      } else {
        return path.join(baseDir, relFile)
      }
    } else {
      return path.join(baseDir, relFile)
    }
  })

  if (compile) {
    let program = ts.createProgram(files, options)
    program.getSourceFiles().forEach(function(sf){
      let emitResults = program.emit(sf)
      if (emitResults.diagnostics.length > 0) {
        throw emitResults.diagnostics
      }
    })
  }

  let code:{[relFile:string]:string} = {}

  jsRelFiles.forEach(function(jsRelFile){
    let jsPath = path.join(outDir, jsRelFile)
    code[jsRelFile] = fs.readFileSync(jsPath).toString()
  })

  return code
}

function removeDecorators(source: string): string {
  let count = 0
  let sf = ts.createSourceFile('blah.ts', source, ts.ScriptTarget.ES5)
  function _removeDecorators(node: ts.Node) {
    ts.forEachChild(node, function(node) {
      if (node.decorators) {
        node.decorators.forEach(function(decorator) {
          let start = decorator.getStart(sf) - count
          let end = decorator.getEnd() - count
          count += (end - start)
          let before = source.substring(0, start)
          let after = source.substring(end)
          source = before + after
        })
      }
      _removeDecorators(node)
    })
  }
  _removeDecorators(sf)
  return source
}
