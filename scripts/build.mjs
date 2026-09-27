// `npm run build` entry point (Vercel runs it for every deployment).
// Migrations are applied only for Vercel production deployments, so preview
// builds of a branch never change the database schema before it is merged.
import { spawnSync } from "node:child_process";

const steps = [["prisma", "generate"]];
if (process.env.VERCEL_ENV === "production") {
  steps.push(["prisma", "migrate", "deploy"]);
} else {
  console.log(
    `Skipping prisma migrate deploy (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}).`,
  );
}
steps.push(["next", "build", "--turbopack"]);

for (const [command, ...args] of steps) {
  console.log(`> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
