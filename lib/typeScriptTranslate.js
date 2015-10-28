var path = require('path');
var fs = require('fs');
var ts = require('typescript');
function cleanAndTranslateTypeScript(code, tmpDir, outDir) {
    var relFiles = Object.keys(code).map(function (relFile) {
        fs.writeFileSync(path.join(tmpDir, relFile), removeDecorators(code[relFile]));
        return relFile;
    });
    var allCode = {};
    translateTypeScript(tmpDir, relFiles, outDir).forEach(function (code, i) {
        allCode[relFiles[i]] = code;
    });
    return allCode;
}
exports.cleanAndTranslateTypeScript = cleanAndTranslateTypeScript;
function translateTypeScript(baseDir, relFiles, outDir) {
    var compiledCode = {};
    var options = {
        module: 1,
        target: 1,
        moduleResolution: 1,
        rootDir: process.cwd(),
        outDir: outDir
    };
    var jsRelFiles = [];
    var compile = false;
    var files = relFiles.map(function (relFile) {
        var tsFile = path.join(baseDir, relFile);
        if (tsFile.substring(tsFile.length - 5) !== '.d.ts') {
            var jsRelFile = relFile.substring(0, relFile.length - 3) + '.js';
            var jsFile = path.join(outDir, jsRelFile);
            jsRelFiles.push(jsRelFile);
            if (!fs.existsSync(jsFile) || fs.statSync(tsFile).mtime >= fs.statSync(jsFile).mtime) {
                compile = true;
            }
        }
        return tsFile;
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
    return jsRelFiles.map(function (jsRelFile) {
        var jsPath = path.join(outDir, jsRelFile);
        return fs.readFileSync(jsPath).toString();
    });
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