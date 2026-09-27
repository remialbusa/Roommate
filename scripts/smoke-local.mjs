/* Runs the interaction suite in LOCAL mode even when .env.local exists
 * (a present Supabase config would otherwise bake online mode into the
 * build, which headless jsdom cannot drive — it has no fetch).
 * Temporarily moves .env.local aside, runs `npm run smoke`, restores it.
 */
import { renameSync, existsSync } from "fs";
import { spawnSync } from "child_process";

const ENV = new URL("../.env.local", import.meta.url);
const BAK = new URL("../.env.local.bak-smoke", import.meta.url);
const hadEnv = existsSync(ENV);
let code = 1;
try {
  if (hadEnv) renameSync(ENV, BAK);
  const run = spawnSync("npm", ["run", "smoke"], { stdio: "inherit", shell: true });
  code = run.status ?? 1;
} finally {
  // NOTE: no process.exit() inside try — it would skip this restore.
  if (hadEnv && existsSync(BAK)) renameSync(BAK, ENV);
}
process.exit(code);
