import { D1FileStorage } from './d1-file-storage';

type RuntimeBindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  [key: string]: unknown;
};

declare global {
  var __STEP_EDU_RUNTIME_ENV__: unknown;
}

export const env = new Proxy({} as RuntimeBindings, {
  get(_target, property) {
    const bindings = globalThis.__STEP_EDU_RUNTIME_ENV__ as RuntimeBindings | undefined;
    if (property === 'BUCKET' && bindings?.FILE_STORAGE === 'd1') return new D1FileStorage(bindings.DB);
    return bindings?.[property as string];
  },
});

export class WorkerEntrypoint {}
export class DurableObject {}
export class WorkflowEntrypoint {}
