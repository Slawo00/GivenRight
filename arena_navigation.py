#!/usr/bin/env python3
import json
import requests
import time
import websocket
import sys

class ArenaNavigator:
    def __init__(self, debug_port=9222):
        self.debug_port = debug_port
        self.base_url = f"http://localhost:{debug_port}"
        self.tab_id = None
        self.ws = None
        
    def get_tabs(self):
        response = requests.get(f"{self.base_url}/json")
        return response.json()
    
    def create_tab(self, url="about:blank"):
        response = requests.put(
            f"{self.base_url}/json/new",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"url": url})
        )
        return response.json()
    
    def connect_websocket(self, tab_id):
        tabs = self.get_tabs()
        tab = next((t for t in tabs if t['id'] == tab_id), None)
        if not tab:
            return False
            
        ws_url = tab['webSocketDebuggerUrl']
        try:
            self.ws = websocket.create_connection(ws_url)
            return True
        except Exception as e:
            print(f"WebSocket connection failed: {e}")
            return False
    
    def send_command(self, method, params=None):
        if not self.ws:
            return None
            
        command = {
            "id": int(time.time() * 1000),
            "method": method,
            "params": params or {}
        }
        
        self.ws.send(json.dumps(command))
        response = self.ws.recv()
        return json.loads(response)
    
    def navigate_to_arena(self):
        # Enable runtime and page domains
        self.send_command("Runtime.enable")
        self.send_command("Page.enable")
        
        # Navigate to Arena.ai
        print("Navigating to Arena.ai...")
        self.send_command("Page.navigate", {"url": "https://arena.ai"})
        
        # Wait for page load
        time.sleep(5)
        
        # Get page title and content
        title_response = self.send_command("Runtime.evaluate", {
            "expression": "document.title"
        })
        
        content_response = self.send_command("Runtime.evaluate", {
            "expression": "document.body ? document.body.innerText.substring(0, 500) : 'No body content'"
        })
        
        print(f"Page Title: {title_response.get('result', {}).get('value', 'Unknown')}")
        print(f"Content Preview: {content_response.get('result', {}).get('value', 'No content')}")
        
        # Look for Explorer link or signup options
        explorer_check = self.send_command("Runtime.evaluate", {
            "expression": """
            Array.from(document.querySelectorAll('a, button')).map(el => ({
                text: el.textContent.trim(),
                href: el.href || 'no-href',
                className: el.className
            })).filter(el => 
                el.text.toLowerCase().includes('explorer') || 
                el.text.toLowerCase().includes('signup') ||
                el.text.toLowerCase().includes('login') ||
                el.text.toLowerCase().includes('start') ||
                el.text.toLowerCase().includes('access')
            )
            """
        })
        
        links = explorer_check.get('result', {}).get('value', [])
        print(f"Found relevant links: {json.dumps(links, indent=2)}")
        
        return links
    
    def close(self):
        if self.ws:
            self.ws.close()

if __name__ == "__main__":
    navigator = ArenaNavigator()
    
    # Create a new tab
    tab = navigator.create_tab()
    tab_id = tab['id']
    print(f"Created tab: {tab_id}")
    
    # Connect WebSocket
    if navigator.connect_websocket(tab_id):
        print("WebSocket connected successfully")
        
        # Navigate and explore
        links = navigator.navigate_to_arena()
        
        # If we found Explorer access, try to navigate
        explorer_link = next((link for link in links if 'explorer' in link['text'].lower()), None)
        if explorer_link and explorer_link['href'] != 'no-href':
            print(f"Found Explorer link: {explorer_link['href']}")
            navigator.send_command("Page.navigate", {"url": explorer_link['href']})
            time.sleep(3)
            
            # Get Explorer page content
            explorer_content = navigator.send_command("Runtime.evaluate", {
                "expression": "document.body ? document.body.innerText.substring(0, 1000) : 'No content'"
            })
            print(f"Explorer Content: {explorer_content.get('result', {}).get('value', 'No content')}")
        
        navigator.close()
    else:
        print("Failed to connect WebSocket")