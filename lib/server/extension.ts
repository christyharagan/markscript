export interface Context {
  inputTypes: string[]
  acceptTypes: string[]
  outputHeaders: { [header: string]: string }
  outputStatus: [number, string]
  outputTypes: string[]
}

export type Parameters = { [param: string]: (string|number|boolean|string[]|number[]|boolean[]) }

export interface Extension {
  get?(context: Context, params: Parameters)

  post?(context: Context, params: Parameters, input: cts.DocumentNode<any>|cts.ValueIterator<any>)

  put?(context: Context, params: Parameters, input: cts.DocumentNode<any>|cts.ValueIterator<any>)

  delete?(context: Context, params: Parameters)
}
