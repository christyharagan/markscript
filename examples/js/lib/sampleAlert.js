module.exports = function(uri, content) {
  xdmp.log('The Sample Alert Ran for document: ' + uri + ' with contents: ' + JSON.stringify(content.toObject()))
}
