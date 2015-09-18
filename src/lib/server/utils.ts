export function deleteAll(dir: string) {
  let docs = xdmp.directory(dir)
  while (true) {
    var doc = docs.next()
    if (doc.done) {
      break
    } else {
      xdmp.documentDelete(doc.value.baseURI)
    }
  }
}

export function deleteGraph(graph?: string) {
  // TODO Stupid hack to work with SystemJS.. fix this
  let r = require
  var sem = r('/MarkLogic/semantics.xqy')
  graph = graph || 'http://marklogic.com/semantics#default-graph'
  sem.graphDelete(sem.iri(graph))
}

export function createCounter(uri: string) {
  xdmp.documentInsert(uri, <Counter>{
    count: 0
  })
}

export function incrementCounter(uri: string): number {
  let counterDoc = cts.doc(uri)
  let counter: Counter = <any>counterDoc.root.toObject()
  let count = counter.count + 1
  xdmp.nodeReplace(counterDoc, {
    count: count
  })
  return count
}

export interface Counter {
  count: number
}
