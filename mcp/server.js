#!/usr/bin/env node
/**
 * TaskBoard MCP server.
 *
 * Exposes a `list_issues` tool that proxies the local TaskBoard REST API
 * (default http://localhost:3001) so a Cowork live artifact can read your
 * board through the MCP transport — the artifact sandbox can't fetch
 * localhost directly, but it can call MCP tools.
 *
 * Override the upstream URL with TASKBOARD_API_URL if you ever change the port.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const BASE_URL = process.env.TASKBOARD_API_URL || 'http://localhost:3001';

const server = new Server(
  { name: 'taskboard', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_issues',
      description:
        'List all issues on the local TaskBoard. Returns an array of Issue objects with fields: ' +
        'id, title, description, status (todo|in-progress|in-review|done), ' +
        'priority (low|medium|high|urgent), file_refs (string[]), position, created_at, updated_at. ' +
        'Issues are sorted by status then position.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name } = req.params;

  if (name === 'list_issues') {
    let resp;
    try {
      resp = await fetch(`${BASE_URL}/api/issues`);
    } catch (err) {
      throw new Error(
        `Could not reach TaskBoard at ${BASE_URL}. Is the server running? (${err.message})`
      );
    }
    if (!resp.ok) {
      throw new Error(`TaskBoard API returned HTTP ${resp.status}`);
    }
    const issues = await resp.json();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(issues),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
