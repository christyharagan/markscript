function deleteAll(dir) {
    var docs = xdmp.directory(dir);
    while (true) {
        var doc = docs.next();
        if (doc.done) {
            break;
        }
        else {
            xdmp.documentDelete(doc.value.baseURI);
        }
    }
}
exports.deleteAll = deleteAll;
function deleteGraph(graph) {
    var r = require;
    var sem = r('/MarkLogic/semantics.xqy');
    graph = graph || 'http://marklogic.com/semantics#default-graph';
    sem.graphDelete(sem.iri(graph));
}
exports.deleteGraph = deleteGraph;
function createCounter(uri) {
    xdmp.documentInsert(uri, {
        count: 0
    });
}
exports.createCounter = createCounter;
function incrementCounter(uri) {
    var counterDoc = cts.doc(uri);
    var counter = counterDoc.root.toObject();
    var count = counter.count + 1;
    xdmp.nodeReplace(counterDoc, {
        count: count
    });
    return count;
}
exports.incrementCounter = incrementCounter;
//# sourceMappingURL=utils.js.map