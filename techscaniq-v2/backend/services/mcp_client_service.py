"""
MCP Client Service for TechScanIQ Backend

Manages MCP connection to Serena server and provides seamless integration
with the LangGraph frontend worker.
"""

import asyncio
import json
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
import subprocess
import os
from contextlib import asynccontextmanager
import aiohttp

logger = logging.getLogger(__name__)


@dataclass
class MCPServerConfig:
    """Configuration for an MCP server"""
    name: str
    command: str
    args: List[str] = field(default_factory=list)
    env: Dict[str, str] = field(default_factory=dict)


@dataclass
class MCPToolDefinition:
    """Definition of an MCP tool"""
    name: str
    description: str
    input_schema: Dict[str, Any]
    server: str


class SerenaeMCPClient:
    """Manages MCP connection to Serena server"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.process: Optional[subprocess.Popen] = None
        self._lock = asyncio.Lock()
        self.connected = False
        self.available_tools: Dict[str, MCPToolDefinition] = {}
        self.server_url: Optional[str] = None
        
    async def connect(self, retry_count: int = 3, retry_delay: float = 2.0):
        """Establish connection to Serena MCP server"""
        async with self._lock:
            if self.connected:
                logger.info("MCP client already connected")
                return
                
            for attempt in range(retry_count):
                try:
                    logger.info(f"Attempting to connect to Serena MCP server (attempt {attempt + 1}/{retry_count})")
                    
                    # Start the Serena MCP server process
                    env = os.environ.copy()
                    env.update({
                        "SERENA_LOG_LEVEL": "INFO",
                        "MCP_SERVER_PORT": "8765"  # Default MCP port
                    })
                    
                    self.process = subprocess.Popen(
                        ["uvx", "--from", "serena", "serena", "--mcp-server"],
                        env=env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    
                    # Wait for server to start
                    await asyncio.sleep(2)
                    
                    # Create HTTP session for JSON-RPC communication
                    self.session = aiohttp.ClientSession()
                    self.server_url = "http://localhost:8765/rpc"
                    
                    # Test connection and discover tools
                    await self._discover_tools()
                    
                    self.connected = True
                    logger.info(f"Connected to Serena MCP. Available tools: {list(self.available_tools.keys())}")
                    return
                    
                except Exception as e:
                    logger.error(f"Failed to connect to Serena MCP (attempt {attempt + 1}): {e}")
                    await self._cleanup()
                    
                    if attempt < retry_count - 1:
                        await asyncio.sleep(retry_delay)
                    else:
                        raise RuntimeError(f"Failed to connect to Serena MCP after {retry_count} attempts")
    
    async def _discover_tools(self):
        """Discover available tools from the MCP server"""
        try:
            # Call the tools/list method
            response = await self._json_rpc_request("tools/list", {})
            
            if "tools" in response:
                for tool in response["tools"]:
                    tool_def = MCPToolDefinition(
                        name=tool["name"],
                        description=tool.get("description", ""),
                        input_schema=tool.get("inputSchema", {}),
                        server="serena"
                    )
                    self.available_tools[tool["name"]] = tool_def
                    
            logger.info(f"Discovered {len(self.available_tools)} tools from Serena MCP")
            
        except Exception as e:
            logger.error(f"Failed to discover tools: {e}")
            raise
    
    async def _json_rpc_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make a JSON-RPC request to the MCP server"""
        if not self.session or not self.server_url:
            raise RuntimeError("MCP client not connected")
            
        request_id = f"req_{asyncio.get_event_loop().time()}"
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": request_id
        }
        
        try:
            async with self.session.post(self.server_url, json=payload) as response:
                response.raise_for_status()
                result = await response.json()
                
                if "error" in result:
                    raise RuntimeError(f"JSON-RPC error: {result['error']}")
                    
                return result.get("result", {})
                
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error during JSON-RPC request: {e}")
            raise
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call a Serena tool with error handling"""
        if not self.connected:
            raise RuntimeError("MCP client not connected")
            
        if tool_name not in self.available_tools:
            raise ValueError(f"Tool '{tool_name}' not found. Available tools: {list(self.available_tools.keys())}")
        
        try:
            logger.debug(f"Calling tool {tool_name} with arguments: {arguments}")
            
            # Make the tool call via JSON-RPC
            result = await self._json_rpc_request("tools/call", {
                "name": tool_name,
                "arguments": arguments
            })
            
            logger.debug(f"Tool {tool_name} returned: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Tool call failed: {tool_name} - {e}")
            raise
    
    async def disconnect(self):
        """Gracefully disconnect from MCP server"""
        async with self._lock:
            await self._cleanup()
            self.connected = False
            logger.info("Disconnected from Serena MCP")
    
    async def _cleanup(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
            self.session = None
            
        if self.process:
            try:
                self.process.terminate()
                await asyncio.sleep(0.5)
                if self.process.poll() is None:
                    self.process.kill()
            except Exception as e:
                logger.error(f"Error terminating MCP process: {e}")
            finally:
                self.process = None
    
    def get_available_tools(self) -> List[str]:
        """Get list of available tool names"""
        return list(self.available_tools.keys())
    
    def get_tool_info(self, tool_name: str) -> Optional[MCPToolDefinition]:
        """Get information about a specific tool"""
        return self.available_tools.get(tool_name)
    
    @asynccontextmanager
    async def session_context(self):
        """Context manager for MCP session"""
        try:
            await self.connect()
            yield self
        finally:
            await self.disconnect()


# Global client instance
mcp_client = SerenaeMCPClient()


# Health check function
async def check_mcp_health() -> Dict[str, Any]:
    """Check the health of the MCP connection"""
    return {
        "connected": mcp_client.connected,
        "available_tools": mcp_client.get_available_tools(),
        "tool_count": len(mcp_client.available_tools)
    }


# Auto-reconnect decorator
def with_mcp_connection(func):
    """Decorator that ensures MCP connection before executing function"""
    async def wrapper(*args, **kwargs):
        if not mcp_client.connected:
            await mcp_client.connect()
        return await func(*args, **kwargs)
    return wrapper