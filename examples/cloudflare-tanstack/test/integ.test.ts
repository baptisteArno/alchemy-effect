import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Bun";
import { expect } from "bun:test";

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  state: Cloudflare.state(),
});
import * as Effect from "effect/Effect";
import * as HttpBody from "effect/unstable/http/HttpBody";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import Stack from "../alchemy.run.ts";

const stack = beforeAll(deploy(Stack));
afterAll.skipIf(!!process.env.NO_DESTROY)(destroy(Stack));

test(
  "deploys and exposes a url",
  Effect.gen(function* () {
    const { url } = yield* stack;
    expect(url).toBeString();
  }),
);

test(
  "uploads, reads, and deletes a file in the R2 bucket",
  Effect.gen(function* () {
    const { url } = yield* stack;
    const key = `hello-${Date.now()}.txt`;
    const body = `hello from r2 at ${new Date().toISOString()}`;

    const put = yield* HttpClient.execute(
      HttpClientRequest.make("PUT")(`${url}/api/files/${key}`).pipe(
        HttpClientRequest.setHeader("content-type", "text/plain"),
        HttpClientRequest.setBody(HttpBody.text(body)),
      ),
    );
    expect(put.status).toBe(201);

    const get = yield* HttpClient.get(`${url}/api/files/${key}`);
    expect(get.status).toBe(200);
    expect(yield* get.text).toBe(body);

    const list = yield* HttpClient.get(`${url}/api/files`);
    const { objects } = (yield* list.json) as {
      objects: { key: string }[];
    };
    expect(objects.map((o) => o.key)).toContain(key);

    // Clean up so stack.destroy() can delete the bucket — R2
    // rejects deleting a non-empty bucket.
    const del = yield* HttpClient.execute(
      HttpClientRequest.make("DELETE")(`${url}/api/files/${key}`),
    );
    expect(del.status).toBe(204);
  }),
  { timeout: 120_000 },
);
