# taskboard-mcp

A tiny [Model Context Protocol](https://modelcontextprotocol.io) server that
proxies the local TaskBoard REST API (`http://localhost:3001`) so it can be
called from Claude / Cowork.

## Install

```bash
cd mcp
npm install
```

## Run (smoke test)

```bash
node server.js
```

The process speaks MCP over stdio — it will look idle. Kill it with `Ctrl-C`.

## Register with Claude / Cowork

Add an entry to your Claude desktop / Cowork MCP config (typically
`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "taskboard": {
      "command": "node",
      "args": ["/Users/ljodice/Code/taskboard/mcp/server.js"]
    }
  }
}
```

Then restart Claude/Cowork so it picks up the new server.

## Tools

- `list_issues` — returns the array from `GET /api/issues`.

## Configuration

- `TASKBOARD_API_URL` — override the upstream base URL. Defaults to
  `http://localhost:3001`.
