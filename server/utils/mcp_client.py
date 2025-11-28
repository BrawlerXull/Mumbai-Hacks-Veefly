"""
MCP Client for interacting with the Google Search MCP Server.
"""
import requests
import json
import os
from typing import Dict, Any, Optional

def call_mcp_server(server_name: str, tool_name: str, args: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Call an MCP server tool with the given arguments.
    
    Args:
        server_name: Name of the MCP server (e.g., 'google-search')
        tool_name: Name of the tool to call (e.g., 'google_search')
        args: Arguments to pass to the tool
        
    Returns:
        Response from the MCP server or None if the call fails
    """
    try:
        # Get the MCP server URL from environment variables or use a default
        mcp_server_url = os.getenv("MCP_SERVER_URL", "http://localhost:3000")
        
        # Prepare the request payload
        payload = {
            "name": tool_name,
            "arguments": args
        }
        
        # Make the request to the MCP server
        response = requests.post(
            f"{mcp_server_url}/api/tools/{server_name}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error calling MCP server: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Exception calling MCP server: {e}")
        return None

def list_available_mcp_servers() -> Dict[str, Any]:
    """
    List all available MCP servers.
    
    Returns:
        Dictionary of available MCP servers and their tools
    """
    try:
        # Get the MCP server URL from environment variables or use a default
        mcp_server_url = os.getenv("MCP_SERVER_URL", "http://localhost:3000")
        
        # Make the request to the MCP server
        response = requests.get(f"{mcp_server_url}/api/servers")
        
        # Check if the request was successful
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error listing MCP servers: {response.status_code} - {response.text}")
            return {}
            
    except Exception as e:
        print(f"Exception listing MCP servers: {e}")
        return {}
