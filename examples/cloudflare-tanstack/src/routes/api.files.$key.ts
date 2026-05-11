import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import type { AppEnv } from "../../alchemy.run.ts";

const bucket = () => (env as unknown as AppEnv).Bucket;

export const Route = createFileRoute("/api/files/$key")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const object = await bucket().get(params.key);
        if (!object) {
          return new Response("Not Found", { status: 404 });
        }
        return new Response(object.body, {
          headers: {
            "content-type":
              object.httpMetadata?.contentType ?? "application/octet-stream",
          },
        });
      },
      PUT: async ({ params, request }) => {
        await bucket().put(params.key, request.body, {
          httpMetadata: {
            contentType:
              request.headers.get("content-type") ?? "application/octet-stream",
          },
        });
        return new Response(null, { status: 201 });
      },
      DELETE: async ({ params }) => {
        await bucket().delete(params.key);
        return new Response(null, { status: 204 });
      },
    },
  },
});
