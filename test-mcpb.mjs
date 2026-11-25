import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath = process.argv[2];
if (!serverPath) throw new Error('Usage: node test-mcpb.mjs <path-to-server/index.js>');
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
  env: { ...process.env, APIFY_TOKEN: '' },
});
const client = new Client({ name: 'evp-mcpb-smoke-test', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);
const tools = await client.listTools();
const names = tools.tools.map((tool) => tool.name);
const catalog = await client.callTool({ name: 'list_public_data_extractors', arguments: {} });
console.log(`tool count: ${names.length}`);
console.log(names.join(','));
console.log(`catalog call ok: ${!catalog.isError}`);
await client.close();
if (names.length !== 11 || catalog.isError) process.exit(1);
