import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const host = process.env.MCP_HOST || '127.0.0.1';
const port = Number.parseInt(process.env.MCP_PORT || '7331', 10);
const endpoint = `http://${host}:${port}/mcp`;

const serverManifestPath = resolve(workspaceRoot, '.mcp', 'server.json');
const schemaPath = resolve(workspaceRoot, 'mcp-schema.json');

const serverManifest = JSON.parse(readFileSync(serverManifestPath, 'utf8'));
if (serverManifest.remotes?.[0]) {
  serverManifest.remotes[0].url = endpoint;
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
if (schema.bridge) {
  schema.bridge.endpoint = endpoint;
}

writeFileSync(serverManifestPath, `${JSON.stringify(serverManifest, null, 2)}\n`, 'utf8');
writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  endpoint,
  updated: [
    '.mcp/server.json',
    'mcp-schema.json'
  ]
}, null, 2));
