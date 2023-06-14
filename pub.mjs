#!/usr/bin/env zx

await $`npm version patch`;
await $`git commit -m "Incrementing package version"`;
await $`git push`;
await $`npm publish`;
// await $`git push`;
