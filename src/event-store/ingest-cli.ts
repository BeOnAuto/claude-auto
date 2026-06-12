export interface IngestCliDeps<Store> {
  createStore: (dbPath: string) => Promise<Store>;
  ingest: (projectDir: string, store: Store) => Promise<void>;
}

export async function ingestCliRun<Store>(
  projectDir: string,
  dbPath: string,
  deps: IngestCliDeps<Store>,
): Promise<void> {
  const store = await deps.createStore(dbPath);
  await deps.ingest(projectDir, store);
}
