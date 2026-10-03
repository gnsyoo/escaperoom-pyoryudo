import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const destination=resolve('dist/art');
if (!existsSync('dist/index.html')) throw new Error('Build the web app first.');
if (!existsSync('art/web/v01')) throw new Error('Run `pnpm optimize:art` to create the WebP art pack first.');
mkdirSync(destination,{recursive:true});
// The web build ships the WebP pack plus vector UI. PNG originals and spoiler galleries stay in the repository.
cpSync(resolve('art/web/v01'),destination,{recursive:true});
for (const folder of ['ui','overlays']) cpSync(resolve('art/production/v01',folder),resolve(destination,folder),{recursive:true});
console.log('WebP art pack and vector UI copied to dist/art.');
