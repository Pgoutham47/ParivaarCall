import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = new URL("marketing/brand/final-logo/", root);
const destination = new URL("public/brand/", root);

await mkdir(destination, { recursive: true });
for (const [master, publicName] of [
  ["ParivaarCall-Embrace-Soft-Serif.png", "parivaarcall-logo.png"],
  ["ParivaarCall-Embrace-Icon.png", "parivaarcall-icon.png"]
]) {
  await copyFile(new URL(master, source), new URL(publicName, destination));
}
console.log(`Approved brand assets synchronized to ${fileURLToPath(destination)}`);
