var path = require('path');
var fs = require('fs');
var ts = require('typescript');
function translateTypeScript(baseDir, relFiles, outDir, tmpDir) {
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }
    if (tmpDir && !fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    }
    var compiledCode = {};
    var options = {
        module: 1,
        target: 1,
        moduleResolution: 1,
        rootDir: baseDir,
        outDir: outDir
    };
    var jsRelFiles = [];
    var compile = false;
    var files = relFiles.map(function (relFile) {
        if (relFile.substring(relFile.length - 5) !== '.d.ts') {
            var jsRelFile = relFile.substring(0, relFile.length - 3) + '.js';
            var jsFile = path.join(outDir, jsRelFile);
            var tsFile = path.join(baseDir, relFile);
            jsRelFiles.push(jsRelFile);
            if (!fs.existsSync(jsFile) || fs.statSync(tsFile).mtime >= fs.statSync(jsFile).mtime) {
                compile = true;
            }
            if (tmpDir) {
                var file = path.join(tmpDir, relFile);
                if (!fs.existsSync(path.dirname(file))) {
                    fs.mkdirSync(path.dirname(file));
                }
                fs.writeFileSync(file, removeDecorators(fs.readFileSync(tsFile).toString()));
                return file;
            }
            else {
                return path.join(baseDir, relFile);
            }
        }
        else {
            return path.join(baseDir, relFile);
        }
    });
    if (compile) {
        var program = ts.createProgram(files, options);
        program.getSourceFiles().forEach(function (sf) {
            var emitResults = program.emit(sf);
            if (emitResults.diagnostics.length > 0) {
                throw emitResults.diagnostics;
            }
        });
    }
    var code = {};
    jsRelFiles.forEach(function (jsRelFile) {
        var jsPath = path.join(outDir, jsRelFile);
        code[jsRelFile] = fs.readFileSync(jsPath).toString();
    });
    return code;
}
exports.translateTypeScript = translateTypeScript;
function removeDecorators(source) {
    var count = 0;
    var sf = ts.createSourceFile('blah.ts', source, 1);
    function _removeDecorators(node) {
        ts.forEachChild(node, function (node) {
            if (node.decorators) {
                node.decorators.forEach(function (decorator) {
                    var start = decorator.getStart(sf) - count;
                    var end = decorator.getEnd() - count;
                    count += (end - start);
                    var before = source.substring(0, start);
                    var after = source.substring(end);
                    source = before + after;
                });
            }
            _removeDecorators(node);
        });
    }
    _removeDecorators(sf);
    return source;
}
//# sourceMappingURL=typescriptTranslate.js.map