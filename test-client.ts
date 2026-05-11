import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Please provide your Hostinger SSE URL (e.g. https://your-domain.com/sse)");
    process.exit(1);
  }

  console.log(`Connecting to ${url}...`);
  const transport = new SSEClientTransport(new URL(url));
  
  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected to the MCP Server successfully!\n");

  console.log("🛠️ Listing available tools provided by the server:");
  const tools = await client.listTools();
  tools.tools.forEach(t => console.log(` - ${t.name}: ${t.description}`));

  console.log("\n🚀 Testing a tool call: Calling 'get_vehicles' to grab some fleet data...");
  try {
    const result = await client.callTool({
      name: "get_vehicles",
      arguments: {} // Fetching without filters just to see if it responds
    });
    
    // We only print the first 500 characters so we don't flood the terminal
    const output = JSON.stringify(result, null, 2);
    console.log("✅ Received data from Fleetio API!");
    console.log(output.substring(0, 500) + "...\n[Data truncated for readability]");
    
  } catch (err: any) {
    console.error("❌ Error calling tool:", err.message);
  }

  process.exit(0);
}

main().catch(console.error);
