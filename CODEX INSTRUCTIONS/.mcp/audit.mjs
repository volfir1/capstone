import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const endpoint = new URL(
  process.env.MCP_BRIDGE_URL ||
  `http://${process.env.MCP_HOST || '127.0.0.1'}:${process.env.MCP_PORT || 7331}/mcp`
);
const workspaceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const target = process.env.SCREENSHOT_TARGET || process.env.MCP_TARGET || '';
const client = new Client({ name: 'protocols-audit', version: '0.1.0' });
const transport = new StreamableHTTPClientTransport(endpoint);

try {
  await client.connect(transport);
  const arguments_ = {
    width: 1600,
    height: 1200,
    waitMs: 4000,
    outputName: 'visual-audit.png'
  };

  if (target) {
    arguments_.target = target.startsWith('file://') || target.startsWith('http')
      ? target
      : resolve(workspaceRoot, target);
  }

  const result = await client.callTool({
    name: 'screenshot',
    arguments: arguments_
  });

  const text = result.content
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n');

  const diagnostics = result.structuredContent?.diagnostics;
  const diagnosticsText = diagnostics && Object.keys(diagnostics).length
    ? `Diagnostics:\n${JSON.stringify(diagnostics, null, 2)}`
    : '';

  console.log([text, diagnosticsText].filter(Boolean).join('\n\n') || JSON.stringify(result, null, 2));
} finally {
  await transport.close();
}
