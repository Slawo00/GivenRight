#!/usr/bin/env python3
import json
import requests
import time
import websocket

tab_id = "4971B3D8CB199F40526DE9DB80FD2A86"
ws_url = f"ws://localhost:9222/devtools/page/{tab_id}"

print("🎯 ARENA.AI EXPLORER ACCESS")
ws = websocket.create_connection(ws_url)

# Enable domains
ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
ws.send(json.dumps({"id": 2, "method": "Page.enable"}))

# Clear previous responses
for _ in range(5):
    try: 
        ws.recv() 
    except: 
        break

print("Loading Arena.ai...")
ws.send(json.dumps({"id": 10, "method": "Page.navigate", "params": {"url": "https://arena.ai"}}))

# Wait for page load
time.sleep(10)

print("Getting page structure...")
ws.send(json.dumps({"id": 20, "method": "Runtime.evaluate", "params": {"expression": """
(() => {
    const result = {
        title: document.title,
        url: window.location.href,
        buttons: [],
        links: [],
        forms: []
    };
    
    // Find all interactive elements
    document.querySelectorAll('button, a[href], input[type="submit"], [role="button"]').forEach(el => {
        const text = el.textContent.trim();
        if (text) {
            if (el.tagName.toLowerCase() === 'a') {
                result.links.push({text, href: el.href, className: el.className});
            } else {
                result.buttons.push({text, className: el.className});
            }
        }
    });
    
    // Find forms
    document.querySelectorAll('form').forEach(form => {
        result.forms.push({action: form.action, method: form.method});
    });
    
    return result;
})()
"""}}))

response = ws.recv()
page_data = json.loads(response)
if 'result' in page_data and 'value' in page_data['result']:
    data = page_data['result']['value']
    
    print(f"Title: {data.get('title', 'Unknown')}")
    print(f"URL: {data.get('url', 'Unknown')}")
    print(f"Found {len(data.get('buttons', []))} buttons")
    print(f"Found {len(data.get('links', []))} links")
    
    # Look for Explorer/Auth links
    all_links = data.get('links', [])
    auth_links = [link for link in all_links if any(keyword in link['text'].lower() 
                 for keyword in ['explorer', 'sign', 'login', 'register', 'start', 'access', 'try'])]
    
    print("\n🔍 RELEVANT LINKS:")
    for link in auth_links[:10]:
        print(f"  📎 {link['text']} -> {link['href']}")
    
    # Look for specific paths
    explorer_links = [link for link in all_links if 'explorer' in link['href'].lower()]
    if explorer_links:
        print(f"\n🎯 FOUND EXPLORER LINKS: {len(explorer_links)}")
        for link in explorer_links:
            print(f"  🚀 {link['text']} -> {link['href']}")
            
            # Navigate to Explorer
            print(f"\nNavigating to Explorer: {link['href']}")
            ws.send(json.dumps({"id": 30, "method": "Page.navigate", "params": {"url": link['href']}}))
            time.sleep(8)
            
            # Get Explorer page content
            ws.send(json.dumps({"id": 31, "method": "Runtime.evaluate", "params": {"expression": """
            ({
                title: document.title,
                url: window.location.href,
                hasModels: document.body.innerText.toLowerCase().includes('model'),
                hasChat: document.body.innerText.toLowerCase().includes('chat'),
                textPreview: document.body.innerText.substring(0, 500)
            })
            """}}))
            
            explorer_response = ws.recv()
            explorer_data = json.loads(explorer_response)
            if 'result' in explorer_data and 'value' in explorer_data['result']:
                explorer_info = explorer_data['result']['value']
                print(f"Explorer Title: {explorer_info.get('title')}")
                print(f"Explorer URL: {explorer_info.get('url')}")
                print(f"Has Models: {explorer_info.get('hasModels')}")
                print(f"Has Chat: {explorer_info.get('hasChat')}")
                print(f"Content Preview: {explorer_info.get('textPreview')}")
            break
    else:
        print("\n❌ No direct Explorer links found")
        
        # Try common Explorer URLs
        explorer_urls = [
            "https://arena.ai/explorer",
            "https://arena.ai/app",
            "https://arena.ai/chat", 
            "https://arena.ai/models",
            "https://arena.ai/benchmark"
        ]
        
        for url in explorer_urls:
            print(f"\n🔍 Trying: {url}")
            ws.send(json.dumps({"id": 40, "method": "Page.navigate", "params": {"url": url}}))
            time.sleep(5)
            
            ws.send(json.dumps({"id": 41, "method": "Runtime.evaluate", "params": {"expression": """
            ({
                title: document.title,
                status: document.body ? 'loaded' : 'no-body',
                content: document.body ? document.body.innerText.substring(0, 300) : 'no content'
            })
            """}}))
            
            test_response = ws.recv()
            test_data = json.loads(test_response)
            if 'result' in test_data and 'value' in test_data['result']:
                test_info = test_data['result']['value']
                print(f"  Title: {test_info.get('title')}")
                print(f"  Status: {test_info.get('status')}")
                print(f"  Content: {test_info.get('content')}")
                
                # Check if this looks like Explorer
                content = test_info.get('content', '').lower()
                if any(keyword in content for keyword in ['model', 'chat', 'benchmark', 'compare']):
                    print(f"  🎯 LOOKS PROMISING!")
                    break

ws.close()
print("\n✅ Arena.ai exploration complete!")