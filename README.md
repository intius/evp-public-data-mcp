# EVP Public Data MCP

<!-- mcp-name: io.github.intius/evp-public-data-mcp -->

[![EVP Public Data MCP server](https://glama.ai/mcp/servers/intius/evp-public-data-mcp/badges/score.svg)](https://glama.ai/mcp/servers/intius/evp-public-data-mcp)

A focused Model Context Protocol server that gives AI assistants structured access to curated public data sources: marketplaces, government opportunities, federal spending, clinical trials, SEC filings, podcasts, and games.

## Verified distribution

- Official MCP Registry name: `io.github.intius/evp-public-data-mcp`
- Registry verification: https://registry.modelcontextprotocol.io/v0/servers?search=evp-public-data-mcp
- One-click MCPB desktop extension release: https://github.com/intius/evp-public-data-mcp/releases/tag/v0.1.0
- MCPB SHA-256: `0ee6e89d92724de2ef4b605a691d2de723a69bfec940af20d0dbfefc142d63dc`

The server exposes small, task-specific tools instead of one generic scraping endpoint. Every tool calls a public Apify Actor, returns clean JSON, and caps results at 25 records per call to reduce accidental spend.

## Available tools

| Tool | Data source | Example use |
|---|---|---|
| `wordpress_plugin_directory` | WordPress Plugin Directory | Find competing SEO plugins and their authors |
| `zapier_app_directory` | Zapier App Directory | Research SaaS integration ecosystems |
| `atlassian_marketplace` | Atlassian Marketplace | Compare vendors and app categories |
| `vscode_marketplace` | VS Code Marketplace | Track developer-tool competitors |
| `apple_podcasts_charts` | Apple Podcasts | Monitor podcast charts and feed URLs |
| `steam_game_intel` | Steam | Collect chart, review, and player metadata |
| `grants_gov` | Grants.gov | Find newly posted federal grant opportunities |
| `usaspending` | USAspending | Research federal awards, recipients, and agencies |
| `clinicaltrials_gov` | ClinicalTrials.gov | Find recruiting trials by condition and country |
| `sec_edgar_filings` | SEC EDGAR | Retrieve company filings by ticker and form type |
| `list_public_data_extractors` | Tool catalog | Discover available extractors and documentation |

## Requirements

- Node.js 18 or newer
- An Apify account and API token

The underlying Actors are pay-per-event. Start with small `maxItems` values. This server caps every call at 25 items.

## Install and run

### Install the Claude Desktop extension

Download `evp-public-data-mcp.mcpb` from the [0.1.0 release](https://github.com/intius/evp-public-data-mcp/releases/tag/v0.1.0), open it with Claude Desktop, click Install, and enter your Apify API token when prompted. Claude Desktop includes the Node.js runtime needed by the extension.

Before installing, you can verify the file hash:

```text
0ee6e89d92724de2ef4b605a691d2de723a69bfec940af20d0dbfefc142d63dc
```

### Run directly from GitHub

```bash
APIFY_TOKEN=your_token npx -y github:intius/evp-public-data-mcp
```

On Windows PowerShell, set the token first:

```powershell
$env:APIFY_TOKEN="your_token"
npx -y github:intius/evp-public-data-mcp
```

### Install from source

```bash
git clone https://github.com/intius/evp-public-data-mcp.git
cd evp-public-data-mcp
npm install
APIFY_TOKEN=your_token npm start
```

### Run with Docker

```bash
docker build -t evp-public-data-mcp .
docker run --rm -i -e APIFY_TOKEN=your_token evp-public-data-mcp
```

The server starts without a token so MCP clients can list tool definitions. The token is required only when a data extraction tool is called.

## MCP client configuration

### Claude Desktop or compatible stdio clients

```json
{
  "mcpServers": {
    "evp-public-data": {
      "command": "npx",
      "args": ["-y", "github:intius/evp-public-data-mcp"],
      "env": {
        "APIFY_TOKEN": "your_token"
      }
    }
  }
}
```

Restart the MCP client after editing the configuration.

## Example prompts

- `Find 10 newly posted infrastructure grants and summarize deadlines, agencies, and award ceilings.`
- `Search ClinicalTrials.gov for recruiting lung cancer trials in the United States.`
- `Get recent Apple 10-K, 10-Q, and 8-K filings and list the filing dates.`
- `Find WordPress SEO plugins and identify the developers behind the highest-rated results.`

## Cost controls

- Each tool defaults to 10 items.
- Each call is capped at 25 items.
- Detailed enrichment is optional where the underlying Actor supports it.
- The server does not run scraping jobs in the background. It only runs when your MCP client calls a tool.

## Documentation and source data

Human-readable documentation, sample rows, input references, Python examples, JavaScript examples, and n8n kits are available at:

https://intius.github.io/evp-labs-data-extractors/

## License

MIT
