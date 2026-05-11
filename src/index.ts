#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FLEETIO_API_TOKEN = process.env.FLEETIO_API_TOKEN;
const FLEETIO_ACCOUNT_TOKEN = process.env.FLEETIO_ACCOUNT_TOKEN;

if (!FLEETIO_API_TOKEN || !FLEETIO_ACCOUNT_TOKEN) {
  console.error("Missing FLEETIO_API_TOKEN or FLEETIO_ACCOUNT_TOKEN in environment variables");
  process.exit(1);
}

const FLEETIO_BASE_URL = "https://secure.fleetio.com/api/v1";

const axiosInstance = axios.create({
  baseURL: FLEETIO_BASE_URL,
  headers: {
    Authorization: `Token token="${FLEETIO_API_TOKEN}"`,
    "Account-Token": FLEETIO_ACCOUNT_TOKEN,
    Accept: "application/json",
  },
});

const server = new Server(
  {
    name: "fleetio-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_vehicles",
        description: "Get a list of vehicles in the Fleetio account. Can filter by various parameters.",
        inputSchema: {
          type: "object",
          properties: {
            q: {
              type: "object",
              description: "Ransack query parameters for filtering. Example: { \"name_eq\": \"Bus 101\" }",
            },
          },
        },
      },
      {
        name: "get_contacts",
        description: "Get a list of contacts (including drivers) in the Fleetio account.",
        inputSchema: {
          type: "object",
          properties: {
            q: {
              type: "object",
              description: "Ransack query parameters. Example: { \"contact_type_name_eq\": \"Driver\" }",
            },
          },
        },
      },
      {
        name: "get_issues",
        description: "Get a list of issues reported for vehicles.",
        inputSchema: {
          type: "object",
          properties: {
            q: {
              type: "object",
              description: "Ransack query parameters.",
            },
          },
        },
      },
      {
        name: "get_fuel_entries",
        description: "Get a list of fuel entries (mileage, gallons, etc) for vehicles.",
        inputSchema: {
          type: "object",
          properties: {
            q: {
              type: "object",
              description: "Ransack query parameters.",
            },
          },
        },
      },
      {
        name: "get_service_entries",
        description: "Get a list of service entries (maintenance, repairs).",
        inputSchema: {
          type: "object",
          properties: {
            q: {
              type: "object",
              description: "Ransack query parameters.",
            },
          },
        },
      }
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    let endpoint = "";
    const args = request.params.arguments || {};
    const params = args.q ? { q: args.q } : {};

    switch (request.params.name) {
      case "get_vehicles":
        endpoint = "/vehicles";
        break;
      case "get_contacts":
        endpoint = "/contacts";
        break;
      case "get_issues":
        endpoint = "/issues";
        break;
      case "get_fuel_entries":
        endpoint = "/fuel_entries";
        break;
      case "get_service_entries":
        endpoint = "/service_entries";
        break;
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const response = await axiosInstance.get(endpoint, { params });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error("Error calling Fleetio API:", error.response?.data || error.message);
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error calling Fleetio API: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Fleetio MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
