import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export const Bucket = Cloudflare.R2Bucket("Bucket");

export const App = Cloudflare.Vite("TanStackStart", {
  compatibility: {
    flags: ["nodejs_compat"],
  },
  bindings: { Bucket },
});

export type AppEnv = Cloudflare.InferEnv<typeof App>;

export default Alchemy.Stack(
  "CloudflareTanstackExample",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const app = yield* App;
    return {
      url: app.url,
    };
  }),
);
