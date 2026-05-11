import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import type { AppEnv } from "../../alchemy.run.ts";

export const Route = createFileRoute("/api/files/")({
  server: {
    handlers: {
      GET: async () => {
        const bucket = (env as unknown as AppEnv).Bucket;
        const listing = await bucket.list({ limit: 100 });
        return Response.json({
          objects: listing.objects.map((o) => ({
            key: o.key,
            size: o.size,
            uploaded: o.uploaded.toISOString(),
          })),
        });
      },
    },
  },
});
