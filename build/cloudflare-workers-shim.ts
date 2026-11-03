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
    return (globalThis.__STEP_EDU_RUNTIME_ENV__ as RuntimeBindings | undefined)?.[property as string];
  },
});

export class WorkerEntrypoint {}
export class DurableObject {}
export class WorkflowEntrypoint {}
