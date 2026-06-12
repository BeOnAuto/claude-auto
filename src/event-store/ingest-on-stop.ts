export interface StopHookInput {
  transcript_path?: string;
  cwd?: string;
}

export interface IngestOnStopDeps<Store> {
  createStore: (dbPath: string) => Promise<Store>;
  ingest: (jsonlPath: string, store: Store) => Promise<void>;
  dbPathFor: (cwd: string) => string;
}

export async function ingestOnStop<Store>(input: StopHookInput, deps: IngestOnStopDeps<Store>): Promise<void> {
  if (!input.transcript_path) return;
  const cwd = input.cwd ?? process.cwd();
  const store = await deps.createStore(deps.dbPathFor(cwd));
  await deps.ingest(input.transcript_path, store);
}
