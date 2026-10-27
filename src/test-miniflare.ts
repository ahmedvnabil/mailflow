import { Miniflare } from "miniflare";

export interface TestMiniflareOptions {
  r2?: boolean;
}

/**
 * Local D1/KV/R2 for tests. Miniflare 5 (via wrangler 4.154) takes a worker
 * config instead of the old top-level `script` / `d1Databases` options.
 */
export function createTestMiniflare(options: TestMiniflareOptions = {}): Miniflare {
  return new Miniflare({
    logRequests: false,
    enableDevRegistry: false,
    workers: [
      {
        config: {
          name: "test",
          compatibilityDate: "2026-06-13",
          manifest: {
            mainModule: "index.mjs",
            modules: {
              "index.mjs": {
                type: "esm",
                contents: "export default {}",
              },
            },
          },
          env: {
            DB: { type: "d1" },
            CONFIG_CACHE: { type: "kv" },
            ...(options.r2 ? { ATTACHMENTS: { type: "r2" } } : {}),
          },
        },
      },
    ],
  });
}
