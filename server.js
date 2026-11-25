#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = 'https://api.apify.com/v2';
const DOCS_BASE = 'https://intius.github.io/evp-labs-data-extractors/actors';
const MAX_ITEMS_CAP = 25;

const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;

const EXTRACTORS = {
  wordpress_plugin_directory: {
    actor: 'wordpress-plugin-directory',
    title: 'WordPress plugin directory search',
    description: 'Search public WordPress plugin listings and return plugin names, slugs, versions, authors, ratings, and links.',
    inputSchema: {
      searchTerm: z.string().describe('Plugin search keyword, for example seo, security, forms, or cache'),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional().describe('Maximum records to return, capped at 25'),
    },
    buildInput: ({ searchTerm, maxItems }) => ({ searchTerm, maxItems }),
  },
  zapier_app_directory: {
    actor: 'zapier-app-directory',
    title: 'Zapier app directory search',
    description: 'Collect public Zapier app directory entries for SaaS ecosystem and integration research.',
    inputSchema: {
      category: z.string().optional().describe('Zapier category slug, for example sales-crm'),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ category, maxItems }) => ({ category, maxItems }),
  },
  atlassian_marketplace: {
    actor: 'atlassian-marketplace',
    title: 'Atlassian Marketplace search',
    description: 'Search public Atlassian Marketplace apps with vendor, pricing, hosting, rating, and install metadata.',
    inputSchema: {
      searchQuery: z.string().describe('Marketplace search query'),
      hosting: z.enum(['cloud', 'datacenter', 'server', 'any']).optional(),
      includeDetails: z.boolean().optional(),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ searchQuery, hosting, includeDetails, maxItems }) => ({ searchQuery, hosting, includeDetails, maxItems }),
  },
  vscode_marketplace: {
    actor: 'vscode-marketplace',
    title: 'VS Code Marketplace search',
    description: 'Search public VS Code extensions with publisher, installs, ratings, versions, and marketplace links.',
    inputSchema: {
      searchTerm: z.string().describe('Extension search term'),
      sortBy: z.enum(['installs', 'rating', 'updated', 'relevance']).optional(),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ searchTerm, sortBy, maxItems }) => ({ searchTerm, sortBy, maxItems }),
  },
  apple_podcasts_charts: {
    actor: 'apple-podcasts-charts',
    title: 'Apple Podcasts chart lookup',
    description: 'Read public Apple Podcasts chart entries by country and genre, including feed URLs where available.',
    inputSchema: {
      country: z.string().length(2).optional().describe('Two letter country code, for example us'),
      genreId: z.string().optional().describe('Apple genre identifier'),
      includeFeedUrl: z.boolean().optional(),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ country, genreId, includeFeedUrl, maxItems }) => ({ country, chart: 'top', genreId, includeFeedUrl, maxItems }),
  },
  steam_game_intel: {
    actor: 'steam-game-intel',
    title: 'Steam game intelligence',
    description: 'Collect public Steam chart and game metadata with review and player-count enrichment.',
    inputSchema: {
      topList: z.enum(['top100in2weeks', 'top100forever', 'top100owned']).optional(),
      includeSteamSpy: z.boolean().optional(),
      includeReviews: z.boolean().optional(),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ topList, includeSteamSpy, includeReviews, maxItems }) => ({ topList, includeSteamSpy, includeReviews, maxItems }),
  },
  grants_gov: {
    actor: 'grants-gov',
    title: 'Grants.gov opportunity search',
    description: 'Search public United States federal grant opportunities with agency, deadline, award, eligibility, and source links.',
    inputSchema: {
      keyword: z.string().optional().describe('Keyword such as infrastructure, SBIR, rural health, or education'),
      includeDetails: z.boolean().optional(),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ keyword, includeDetails, maxItems }) => ({ keyword, oppStatuses: ['posted'], includeDetails, maxItems }),
  },
  usaspending: {
    actor: 'usaspending',
    title: 'USAspending award search',
    description: 'Search public United States federal contract and assistance awards with agency, recipient, amount, and date fields.',
    inputSchema: {
      agency: z.string().optional().describe('Awarding agency name'),
      awardTypes: z.string().optional().describe('Comma separated award types, for example contracts'),
      minAmount: z.number().min(0).optional(),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ agency, awardTypes, minAmount, maxItems }) => ({ agency, awardTypes, minAmount, sortBy: 'amount', includeDetails: true, maxItems }),
  },
  clinicaltrials_gov: {
    actor: 'clinicaltrials-gov',
    title: 'ClinicalTrials.gov study search',
    description: 'Search public clinical trial records by condition, recruitment status, and country.',
    inputSchema: {
      condition: z.string().describe('Condition or disease, for example lung cancer'),
      status: z.string().optional().describe('Recruitment status such as RECRUITING'),
      country: z.string().optional(),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ condition, status, country, maxItems }) => ({ condition, status, country, maxItems }),
  },
  sec_edgar_filings: {
    actor: 'sec-edgar-filings',
    title: 'SEC EDGAR filing search',
    description: 'Collect public SEC EDGAR company filings by ticker, form types, and start date.',
    inputSchema: {
      ticker: z.string().describe('Public company ticker, for example AAPL'),
      forms: z.string().optional().describe('Comma separated forms, for example 10-K,10-Q,8-K'),
      startDate: z.string().optional().describe('ISO start date, for example 2025-01-01'),
      maxItems: z.number().int().min(1).max(MAX_ITEMS_CAP).optional(),
    },
    buildInput: ({ ticker, forms, startDate, maxItems }) => ({ ticker, forms, startDate, maxItems }),
  },
};

function cleanInput(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

async function runExtractor(config, args) {
  if (!token) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'APIFY_TOKEN is not configured. Create an Apify API token, set APIFY_TOKEN, and restart the MCP server.' }],
    };
  }

  const maxItems = Math.min(args.maxItems ?? 10, MAX_ITEMS_CAP);
  const input = cleanInput({ ...config.buildInput({ ...args, maxItems }), maxItems });
  const actorId = encodeURIComponent(`evpp~${config.actor}`);
  const url = `${API_BASE}/acts/${actorId}/run-sync-get-dataset-items?timeout=120&memory=512`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(input),
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = null;
    }
    if (!response.ok) {
      const detail = data?.error?.message || data?.message || text.slice(0, 600);
      return { isError: true, content: [{ type: 'text', text: `Apify run failed with HTTP ${response.status}: ${detail}` }] };
    }
    const items = Array.isArray(data) ? data.slice(0, maxItems) : [];
    const payload = {
      actor: `evpp/${config.actor}`,
      documentation: `${DOCS_BASE}/${config.actor}/`,
      input,
      itemCount: items.length,
      items,
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: `Apify request failed: ${error.message}` }] };
  }
}

const server = new McpServer({
  name: 'evp-public-data-mcp',
  version: '0.1.0',
});

server.registerTool(
  'list_public_data_extractors',
  {
    title: 'List public data extractors',
    description: 'List the curated public data extractor tools available in this MCP server, with documentation links.',
    inputSchema: {},
  },
  async () => {
    const extractors = Object.entries(EXTRACTORS).map(([tool, config]) => ({
      tool,
      actor: `evpp/${config.actor}`,
      title: config.title,
      description: config.description,
      documentation: `${DOCS_BASE}/${config.actor}/`,
    }));
    const payload = { extractors };
    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
  },
);

for (const [toolName, config] of Object.entries(EXTRACTORS)) {
  server.registerTool(
    toolName,
    {
      title: config.title,
      description: `${config.description} Results are capped at 25 records per call to control cost.`,
      inputSchema: config.inputSchema,
    },
    async (args) => runExtractor(config, args),
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
