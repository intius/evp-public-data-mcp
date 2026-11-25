import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const stage = path.join(root, 'dist', 'mcpb-stage');
const output = path.join(root, 'dist', 'evp-public-data-mcp.mcpb');
const serverOut = path.join(stage, 'server', 'index.js');

fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(path.dirname(serverOut), { recursive: true });

await build({
    entryPoints: [path.join(root, 'server.js')],
    outfile: serverOut,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    logLevel: 'silent',
});

let bundled = fs.readFileSync(serverOut, 'utf8');
if (bundled.startsWith('#!')) {
    bundled = bundled.slice(bundled.indexOf('\n') + 1);
    fs.writeFileSync(serverOut, bundled);
}

for (const file of ['icon.png', 'manifest.json', 'package-lock.json']) {
    fs.copyFileSync(path.join(root, file), path.join(stage, file));
}
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
delete packageJson.devDependencies;
delete packageJson.scripts['build:mcpb'];
fs.writeFileSync(path.join(stage, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);

const npx = process.platform === 'win32' ? 'npx' : 'npx';
execFileSync(npx, ['-y', '@anthropic-ai/mcpb@2.1.2', 'pack', stage, output], { stdio: 'inherit', shell: process.platform === 'win32' });
execFileSync(npx, ['-y', '@anthropic-ai/mcpb@2.1.2', 'validate', path.join(stage, 'manifest.json')], { stdio: 'inherit', shell: process.platform === 'win32' });
console.log(`built ${path.relative(root, output)}`);
