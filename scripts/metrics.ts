import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function files(root: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(root, { withFileTypes: true })).map(async (entry) => {
        const location = path.join(root, entry.name);
        return entry.isDirectory() ? files(location) : [location];
      }),
    )
  ).flat();
}

const appFiles = await files("app");
const testFiles = await files("tests");
const providerFiles = await files("lib/providers");
const schema = await readFile("prisma/schema.prisma", "utf8");
const tests = await Promise.all(
  testFiles
    .filter((file) => file.endsWith(".test.ts") || file.endsWith(".spec.ts"))
    .map((file) => readFile(file, "utf8")),
);
const providers = await Promise.all(
  providerFiles
    .filter((file) => file.endsWith(".ts"))
    .map((file) => readFile(file, "utf8")),
);

console.log(
  JSON.stringify(
    {
      pageRoutes: appFiles.filter((file) => file.endsWith("page.tsx")).length,
      apiRoutes: appFiles.filter((file) => file.endsWith("route.ts")).length,
      databaseModels: [...schema.matchAll(/^model\s+\w+/gm)].length,
      automatedTests: tests.reduce(
        (sum, source) =>
          sum + [...source.matchAll(/\b(?:it|test)\s*\(/g)].length,
        0,
      ),
      providerEndpointCalls: providers.reduce(
        (sum, source) => sum + [...source.matchAll(/https:\/\//g)].length,
        0,
      ),
      seededFixtureRecords: 2,
    },
    null,
    2,
  ),
);
