#!/usr/bin/env python3
import json
import requests
import time
import websocket
import threading

def wait_for_response(ws, timeout=10):
    try:
        return json.loads(ws.recv())
    except:
        return None

def arena_explorer():
    tab_id = "4971B3D8CB199F40526DE9DB80FD2A86"
    ws_url = f"ws://localhost:9222/devtools/page/{tab_id}"
    
    print("🚀 FINAL ARENA.AI ACCESS ATTEMPT")
    
    try:
        ws = websocket.create_connection(ws_url, timeout=10)
        
        # Enable runtime
        ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
        ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
        
        # Clear responses
        for _ in range(3):
            try: ws.recv() 
            except: break
        
        # Navigate to Arena.ai
        print("📡 Connecting to Arena.ai...")
        ws.send(json.dumps({"id": 10, "method": "Page.navigate", "params": {"url": "https://arena.ai"}}))
        
        # Wait for navigation
        time.sleep(12)
        
        # Get page info
        print("🔍 Analyzing page...")
        ws.send(json.dumps({"id": 20, "method": "Runtime.evaluate", "params": {"expression": """
        JSON.stringify({
            title: document.title,
            url: window.location.href,
            readyState: document.readyState,
            links: Array.from(document.links).slice(0, 20).map(l => ({
                text: l.textContent.trim().substring(0, 50),
                href: l.href
            })),
            buttons: Array.from(document.querySelectorAll('button, [role="button"]')).slice(0, 10).map(b => ({
                text: b.textContent.trim().substring(0, 50),
                className: b.className
            })),
            bodyText: document.body ? document.body.innerText.substring(0, 1000) : 'no body'
        })
        """}}))
        
        response = wait_for_response(ws)
        if response and 'result' in response:
            try:
                data = json.loads(response['result']['value'])
                
                print(f"📄 Title: {data.get('title', 'No title')}")
                print(f"🌐 URL: {data.get('url', 'No URL')}")
                print(f"🔄 Ready State: {data.get('readyState', 'Unknown')}")
                
                print(f"\n🔗 Links Found: {len(data.get('links', []))}")
                for link in data.get('links', [])[:5]:
                    if link['text']:
                        print(f"  • {link['text']} -> {link['href']}")
                
                print(f"\n🔘 Buttons Found: {len(data.get('buttons', []))}")
                for btn in data.get('buttons', [])[:5]:
                    if btn['text']:
                        print(f"  • {btn['text']}")
                
                print(f"\n📝 Body Text Preview:")
                print(data.get('bodyText', 'No content')[:500])
                
                # Try to access Explorer directly
                explorer_urls = [
                    "https://arena.ai/app",
                    "https://arena.ai/explorer", 
                    "https://arena.ai/chat",
                    "https://arena.ai/models"
                ]
                
                for url in explorer_urls:
                    print(f"\n🎯 Trying direct access: {url}")
                    ws.send(json.dumps({"id": 30, "method": "Page.navigate", "params": {"url": url}}))
                    time.sleep(8)
                    
                    ws.send(json.dumps({"id": 31, "method": "Runtime.evaluate", "params": {"expression": """
                    JSON.stringify({
                        title: document.title,
                        url: window.location.href,
                        content: document.body ? document.body.innerText.substring(0, 500) : 'no body',
                        hasLogin: document.body ? document.body.innerText.toLowerCase().includes('login') : false,
                        hasSignup: document.body ? document.body.innerText.toLowerCase().includes('sign') : false,
                        hasModels: document.body ? document.body.innerText.toLowerCase().includes('model') : false
                    })
                    """}}))
                    
                    test_response = wait_for_response(ws)
                    if test_response and 'result' in test_response:
                        try:
                            test_data = json.loads(test_response['result']['value'])
                            print(f"  📋 Title: {test_data.get('title', 'No title')}")
                            print(f"  📍 Final URL: {test_data.get('url', 'Unknown')}")
                            print(f"  🔐 Has Login: {test_data.get('hasLogin', False)}")
                            print(f"  📝 Has Signup: {test_data.get('hasSignup', False)}")
                            print(f"  🤖 Has Models: {test_data.get('hasModels', False)}")
                            print(f"  📄 Content: {test_data.get('content', 'No content')[:200]}...")
                            
                            if test_data.get('hasModels') or 'arena' in test_data.get('content', '').lower():
                                print(f"  🎉 SUCCESS! Found Arena interface at {url}")
                                break
                        except json.JSONDecodeError:
                            print(f"  ❌ Failed to parse response for {url}")
                    else:
                        print(f"  ❌ No response for {url}")
                        
            except json.JSONDecodeError:
                print("❌ Failed to parse main page data")
        
        ws.close()
        
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    arena_explorer()