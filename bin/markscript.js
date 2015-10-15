#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var Build = require('../lib/build');
var coreBuildPlugin_1 = require('../lib/coreBuildPlugin');
var p = require('typescript-package');
var Yargs = require('yargs');
var os = require('os');
var ts = require('typescript');
var chalk = require("chalk");
var sanitize = require("sanitize-filename");
var Liftoff = require('liftoff');
var cli = new Liftoff({
    name: 'markscript',
    configName: 'markscriptfile',
    extensions: {
        '.ts': null,
        '.js': null
    }
});
cli.launch({}, function (env) {
    var yargs = Yargs
        .usage('Build your MarkScript project.\nUsage: markscript <task>')
        .demand(1)
        .command('init', 'Initialise a new MarkScript project')
        .help('help')
        .version(p.getPackageJson(env.cwd).version);
    var argv = yargs.argv;
    var taskName = argv._[0];
    if (taskName === 'init') {
        console.log('TODO - Sorry ;)');
        process.exit(1);
    }
    if (!env.configPath) {
        console.error('markscriptfile.{js,ts} not found');
        process.exit(1);
    }
    var buildFile = require(env.configPath).build;
    if (!buildFile) {
        console.error('markscriptfile should export a const value called "build" of type MarkScript.Build');
        process.exit(1);
    }
    var plugins = [coreBuildPlugin_1.coreBuildPlugin];
    if (buildFile.plugins) {
        plugins = plugins.concat(buildFile.plugins);
    }
    var pkgDir = buildFile.pkgDir || env.cwd;
    process.chdir(pkgDir);
    var isTypeScript = env.configPath.substring(env.configPath.length - 3) === '.ts';
    var build = new Build.Build({
        buildConfig: buildFile.buildConfig,
        plugins: plugins,
        pkgDir: pkgDir,
        buildModelPersistanceFolder: buildFile.buildModelPersistanceFolder,
        isTypeScript: isTypeScript,
        runtime: buildFile.runtime,
        tasks: buildFile.tasks
    });
    Object.keys(build.tasks).forEach(function (taskName) {
        yargs.command(taskName, build.tasks[taskName].description);
    });
    if (isTypeScript) {
        var sanitizeOptions = {
            replacement: "_"
        };
        var parts = process.cwd().split(path.sep).map(function (p) {
            return sanitize(p, sanitizeOptions);
        });
        var cachePath = path.join.apply(null, parts);
        var outDir = path.join(os.tmpdir(), 'markscript-to-typescript', cachePath);
        var options = {
            module: 1,
            rootDir: '.',
            outDir: outDir,
            target: 1,
            moduleResolution: 2
        };
        function compile(filename, options) {
            var program = ts.createProgram([filename], options);
            var emitResult = program.emit();
            var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
            if (allDiagnostics.length > 0) {
                allDiagnostics.forEach(function (diagnostic) {
                    var position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                    console.error(chalk.bgRed(String(diagnostic.code)), chalk.grey(diagnostic.file.fileName + ", (" + position.line + ", " + position.character + ")"), diagnostic.messageText);
                });
                throw new Error('TypeScript Compilation Errors');
            }
        }
        function req(module, filename) {
            var relative = path.relative(path.join(process.cwd(), options.rootDir), path.dirname(filename));
            var basename = path.basename(filename, '.ts');
            var out = path.join(outDir, relative, basename + '.js');
            if (!fs.readFileSync(out) || (fs.statSync(out).mtime > fs.statSync(filename).mtime)) {
                compile(filename, options);
            }
            module._compile(fs.readFileSync(out, 'utf8'), filename);
        }
        require.extensions['.ts'] = req;
    }
    build.runTasks(taskName);
});
//# sourceMappingURL=cli.js.map