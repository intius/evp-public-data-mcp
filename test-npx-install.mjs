import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const transport = new StdioClientTransport({
  command,
  args: ['-y', 'github:intius/evp-public-data-mcp#v0.1.1'],
  env: { ...process.env, APIFY_TOKEN: '' },
});
const client = new Client({ name: 'evp-npx-smoke-test', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);
const tools = await client.listTools();
console.log(`tool count: ${tools.tools.length}`);
console.log(tools.tools.map((tool) => tool.name).join(','));
await client.close();
if (tools.tools.length !== 11) process.exit(1);
