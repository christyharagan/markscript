var chalk = require("chalk");
var fs = require("fs");
var os = require("os");
var path = require("path");
var sanitize = require("sanitize-filename");
var typescript = require("typescript");
try {
    var tsConfig = require(path.join(process.cwd(), './tsconfig.json'));
}
finally { }
/**
 * Module Configuration Options
 */
var Config;
(function (Config) {
    Config[Config["EMIT_ERROR"] = 0] = "EMIT_ERROR";
    Config[Config["USE_CACHE"] = 1] = "USE_CACHE";
    Config[Config["COMPILER_OPTIONS"] = 2] = "COMPILER_OPTIONS";
})(Config || (Config = {}));
/**
 * Requires a TypeScript file
 * @param {Module} module   The node module
 * @param {string} filename The module filename
 */
function req(module, filename) {
    var options = compilerOptions();
    var out = dest(filename, options);

    if (!useCache() || isModified(filename, out)) {
        compile(filename, options);
    }
    module._compile(fs.readFileSync(out, "utf8"), filename);
}
require.extensions[".ts"] = req;
/**
 * Checks the environment for whether or not we should emit an error. Defaults
 * to true.
 * @return {boolean} Whether or not to emit TypeScript errors
 */
function emitError() {
    return env(Config.EMIT_ERROR, true, toBoolean);
}
/**
 * Checks the environment for whether or not we should use a build cache.
 * Defaults to true.
 * @return {boolean} Whether or not to use cached JavaScript files
 */
function useCache() {
    return env(Config.USE_CACHE, true, toBoolean);
}
/**
 * TypeScript Default Configuration
 * @type {typescript.CompilerOptions}
 */
var defaultCompilerOptions = {
    module: typescript.ModuleKind.CommonJS,
    rootDir: '.',
    outDir: getCachePath(process.cwd()),
    target: typescript.ScriptTarget.ES5
};
/**
 * Returns path to cache for source directory.
 * @param  {string} directory Directory with source code
 * @return {string}           Path with all special characters replaced with _ and
 *                            prepended path to temporary directory
 */
function getCachePath(directory) {
    var sanitizeOptions = {
        replacement: "_"
    };
    var parts = directory.split(path.sep).map(function (p) { return sanitize(p, sanitizeOptions); });
    var cachePath = path.join.apply(null, parts);
    var options = compilerOptions() || {};
    return path.join(os.tmpdir(), "typescript-register", options.rootDir || '.', cachePath);
}
/**
 * Checks the environment for JSON stringified compiler options. By default it
 * will compile TypeScript files into a scoped temp directory using ES5 and
 * CommonJS targets.
 * @return {typescript.CompilerOptions} The TypeScript compiler settings
 */
function compilerOptions() {
    return env(Config.COMPILER_OPTIONS, defaultCompilerOptions, toOptions);
}
/**
 * Gets a value from env
 * @param  {Config}   config   The configuration target
 * @param  {T}        fallback The default value
 * @param  {Function} map      The map function if the value exists
 * @return {T}                 The environment variable
 */
function env(config, fallback, map) {
    var key = "TYPESCRIPT_REGISTER_" + Config[config];
    if (process.env.hasOwnProperty(key)) {
        return map(process.env[key]);
    }
    return fallback;
}
/**
 * Returns the JavaScript destination for the path
 * @param  {string}                      filename The TypeScript filename
 * @param  {typescript.CompilerOptiones} options  The Compiler Options
 * @return {string}                               The JavaScript filepath
 */
function dest(filename, options) {
    var relative = path.relative(path.join(process.cwd(), options.rootDir), path.dirname(filename));
    var basename = path.basename(filename, '.ts');
    var outDir = options.outDir || path.dirname(filename);
    return path.join(outDir, relative, basename + ".js");
}
/**
 * Check whether or not the path is modified
 * @param  {string}  tsPath The path to the TypeScript file
 * @param  {string}  jsPath The path to the JavaScript file
 * @return {boolean}        Whether or not the file is modified
 */
function isModified(tsPath, jsPath) {
    try {
        var js = fs.statSync(jsPath).mtime;
        var ts = fs.statSync(tsPath).mtime;
        return ts > js;
    }
    catch (err) {
        return true;
    }
}
/**
 * Compiles the TypeScript file
 * @param {string}                     filename The root file to compile
 * @param {typescript.CompilerOptions} options  The Compiler Options
 */
function compile(filename, options) {
    var program = typescript.createProgram([filename], options);
    var emitResult = program.emit();
    var allDiagnostics = typescript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    if (emitError()) {
        checkErrors(allDiagnostics);
    }
}
/**
 * Converts a list of errors into something readable
 * @param  {typescript.Diagnostic[]} errors The TypeScript Diagnostics
 * @return {Error}                          The Compiler Error
 */
function checkErrors(errors) {
    if (errors.length === 0) {
        return;
    }
    errors.forEach(function (diagnostic) {
        var position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        console.error(chalk.bgRed("" + diagnostic.code), chalk.grey(diagnostic.file.filename + ", (" + position.line + "," + position.character + ")"), diagnostic.messageText);
    });
    throw new Error("TypeScript Compilation Errors");
}
/**
 * Converts a string to boolean
 * @param  {string}  value The string value
 * @return {boolean}       Whether or not the string is "true"
 */
function toBoolean(value) {
    return value === "true";
}
/**
 * Converts a string to TypeScript compiler options
 * @param  {string}                     value The string value
 * @return {typescript.CompilerOptions}       The TypeScript Compiler Options
 */
function toOptions(value) {
    return JSON.parse(value);
}

process.env.TYPESCRIPT_REGISTER_EMIT_ERROR = false
