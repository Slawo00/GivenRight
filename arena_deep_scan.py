#!/usr/bin/env python3
import json
import requests
import time
import websocket
import sys

class ArenaDeepScan:
    def __init__(self, debug_port=9222):
        self.debug_port = debug_port
        self.base_url = f"http://localhost:{debug_port}"
        self.tab_id = None
        self.ws = None
        
    def connect_websocket(self, tab_id):
        tabs = requests.get(f"{self.base_url}/json").json()
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
    
    def scan_arena(self):
        # Enable domains
        self.send_command("Runtime.enable")
        self.send_command("Page.enable")
        self.send_command("Network.enable")
        
        print("=== DEEP SCAN: Arena.ai ===")
        
        # Navigate to Arena.ai
        nav_response = self.send_command("Page.navigate", {"url": "https://arena.ai"})
        print(f"Navigation initiated: {nav_response}")
        
        # Wait for initial load
        time.sleep(8)
        
        # Check current URL
        current_url = self.send_command("Runtime.evaluate", {
            "expression": "window.location.href"
        })
        print(f"Current URL: {current_url.get('result', {}).get('value', 'Unknown')}")
        
        # Get page title
        title = self.send_command("Runtime.evaluate", {
            "expression": "document.title"
        })
        print(f"Page Title: {title.get('result', {}).get('value', 'Unknown')}")
        
        # Get full page HTML (first 2000 chars)
        html_preview = self.send_command("Runtime.evaluate", {
            "expression": "document.documentElement.outerHTML.substring(0, 2000)"
        })
        html_content = html_preview.get('result', {}).get('value', 'No HTML')
        print(f"HTML Preview:\n{html_content}\n")
        
        # Check for JavaScript errors
        console_check = self.send_command("Runtime.evaluate", {
            "expression": """
            window._arena_errors = [];
            window.addEventListener('error', function(e) {
                window._arena_errors.push(e.message + ' at ' + e.filename + ':' + e.lineno);
            });
            'Error listener installed';
            """
        })
        print(f"Error listener: {console_check.get('result', {}).get('value', 'Failed')}")
        
        # Wait for page to fully load
        time.sleep(5)
        
        # Look for interactive elements
        interactive_elements = self.send_command("Runtime.evaluate", {
            "expression": """
            Array.from(document.querySelectorAll('*')).slice(0, 50).map(el => ({
                tag: el.tagName,
                id: el.id,
                className: el.className,
                textContent: el.textContent ? el.textContent.trim().substring(0, 100) : '',
                href: el.href || '',
                onclick: el.onclick ? 'has-click' : 'no-click'
            })).filter(el => 
                el.textContent.length > 0 || 
                el.href.length > 0 || 
                el.onclick === 'has-click'
            )
            """
        })
        
        elements = interactive_elements.get('result', {}).get('value', [])
        print(f"Found {len(elements)} interactive elements:")
        for elem in elements[:10]:  # Show first 10
            print(f"  {elem}")
        
        # Try to find login/signup buttons
        auth_elements = self.send_command("Runtime.evaluate", {
            "expression": """
            const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
            buttons.map(btn => ({
                text: btn.textContent.trim(),
                href: btn.href || 'no-href',
                type: btn.type || 'no-type',
                className: btn.className
            })).filter(btn => 
                btn.text.toLowerCase().includes('sign') ||
                btn.text.toLowerCase().includes('login') ||
                btn.text.toLowerCase().includes('register') ||
                btn.text.toLowerCase().includes('explorer') ||
                btn.text.toLowerCase().includes('start') ||
                btn.text.toLowerCase().includes('access')
            )
            """
        })
        
        auth_buttons = auth_elements.get('result', {}).get('value', [])
        print(f"\nFound {len(auth_buttons)} auth-related buttons:")
        for btn in auth_buttons:
            print(f"  {btn}")
        
        # Check network requests
        print("\nWaiting for additional network activity...")
        time.sleep(3)
        
        # Try different Arena.ai routes
        routes_to_try = [
            "https://arena.ai/explorer",
            "https://arena.ai/signup", 
            "https://arena.ai/login",
            "https://arena.ai/app",
            "https://arena.ai/models"
        ]
        
        for route in routes_to_try:
            print(f"\n--- Trying route: {route} ---")
            nav_response = self.send_command("Page.navigate", {"url": route})
            time.sleep(4)
            
            route_title = self.send_command("Runtime.evaluate", {
                "expression": "document.title"
            })
            
            route_content = self.send_command("Runtime.evaluate", {
                "expression": "document.body ? document.body.innerText.substring(0, 300) : 'No body'"
            })
            
            print(f"Route Title: {route_title.get('result', {}).get('value', 'Unknown')}")
            print(f"Route Content: {route_content.get('result', {}).get('value', 'No content')}")
            
            # Check if we found something useful
            if "explorer" in route_content.get('result', {}).get('value', '').lower():
                print("🎯 FOUND EXPLORER ACCESS!")
                break
        
        # Get any errors that occurred
        errors_check = self.send_command("Runtime.evaluate", {
            "expression": "window._arena_errors || []"
        })
        errors = errors_check.get('result', {}).get('value', [])
        if errors:
            print(f"\nJavaScript Errors: {errors}")
        
    def close(self):
        if self.ws:
            self.ws.close()

if __name__ == "__main__":
    scanner = ArenaDeepScan()
    
    # Get available tabs
    tabs = requests.get(f"{scanner.base_url}/json").json()
    print(f"Available tabs: {len(tabs)}")
    
    # Use the first available tab
    if tabs:
        tab_id = tabs[0]['id']
        if scanner.connect_websocket(tab_id):
            scanner.scan_arena()
            scanner.close()
        else:
            print("Failed to connect WebSocket")
    else:
        print("No tabs available")