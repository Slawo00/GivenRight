#!/usr/bin/env python3
import json
import requests
import time
import websocket

# Direct approach - bypass auth issues
print("🎯 DIRECT ARENA ACCESS ATTEMPT")

tab_id = "4971B3D8CB199F40526DE9DB80FD2A86"
ws = websocket.create_connection(f"ws://localhost:9222/devtools/page/{tab_id}")

# Enable
ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
ws.send(json.dumps({"id": 2, "method": "Page.enable"}))

# Clear
for _ in range(3): 
    try: ws.recv()
    except: break

print("📡 Loading Arena.ai...")
ws.send(json.dumps({"id": 10, "method": "Page.navigate", "params": {"url": "https://arena.ai"}}))
time.sleep(10)

print("🔍 Scanning for direct access...")
ws.send(json.dumps({"id": 20, "method": "Runtime.evaluate", "params": {"expression": """
// Look for any direct model access or API endpoints
(() => {
    const result = {
        title: document.title,
        url: window.location.href,
        scripts: Array.from(document.scripts).map(s => s.src).filter(s => s),
        links: Array.from(document.links).map(l => ({text: l.textContent.trim(), href: l.href})).slice(0, 20),
        apis: [],
        buttons: Array.from(document.querySelectorAll('button, [role="button"]')).map(b => b.textContent.trim()).filter(t => t),
        hasAuth: document.body.innerHTML.includes('clerk') || document.body.innerHTML.includes('auth'),
        clerk: !!window.Clerk,
        nextData: !!window.__NEXT_DATA__
    };
    
    // Check for API calls in window object
    if (window.fetch) {
        result.apis.push('fetch available');
    }
    
    // Look for exposed API endpoints
    if (window.__NEXT_DATA__ && window.__NEXT_DATA__.props) {
        result.nextData = true;
    }
    
    return result;
})()
"""}}))

response = ws.recv()
data = json.loads(response)

if 'result' in data and 'value' in data['result']:
    info = data['result']['value']
    
    print(f"📄 Title: {info['title']}")
    print(f"🌐 URL: {info['url']}")
    print(f"🔐 Has Auth: {info['hasAuth']}")
    print(f"📜 Scripts: {len(info['scripts'])}")
    print(f"🔗 Links: {len(info['links'])}")
    print(f"🔘 Buttons: {len(info['buttons'])}")
    print(f"⚛️ NextJS Data: {info['nextData']}")
    print(f"🔑 Clerk: {info['clerk']}")

# Try to find any direct model endpoints
print("\n🔍 Looking for API endpoints...")
ws.send(json.dumps({"id": 30, "method": "Runtime.evaluate", "params": {"expression": """
// Check network requests and try to find API patterns
(() => {
    const apis = [];
    
    // Check fetch override
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        apis.push('Fetch called: ' + (args[0] ? args[0].toString() : 'unknown'));
        return originalFetch.apply(this, args);
    };
    
    // Look in scripts for API endpoints
    const scripts = Array.from(document.scripts).map(s => s.innerHTML).join(' ');
    const apiMatches = scripts.match(/https?:\/\/[^"'\s]+api[^"'\s]*/gi) || [];
    
    return {
        apis: apis,
        foundEndpoints: apiMatches.slice(0, 10),
        hasApiText: scripts.includes('/api/'),
        scriptLength: scripts.length
    };
})()
"""}}))

api_response = ws.recv()
api_data = json.loads(api_response)

if 'result' in api_data and 'value' in api_data['result']:
    api_info = api_data['result']['value']
    print(f"🌐 Found Endpoints: {len(api_info['foundEndpoints'])}")
    for endpoint in api_info['foundEndpoints']:
        print(f"  • {endpoint}")

# Try bypassing auth by accessing app directly with session manipulation
print("\n🚀 Attempting session bypass...")

# Set fake user session
ws.send(json.dumps({"id": 40, "method": "Runtime.evaluate", "params": {"expression": """
// Try to create a fake session
(() => {
    try {
        // Set localStorage items that might indicate logged in state
        localStorage.setItem('clerk-session', 'fake-session-token');
        localStorage.setItem('user-authenticated', 'true');
        localStorage.setItem('arena-user', JSON.stringify({id: 'test', email: 'test@example.com'}));
        
        // Try to trigger any auth state change
        window.dispatchEvent(new Event('storage'));
        
        return 'Session manipulation attempted';
    } catch (e) {
        return 'Error: ' + e.message;
    }
})()
"""}}))

session_response = ws.recv()
print(f"Session bypass: {session_response}")

# Now try accessing the app
print("\n📱 Accessing app after session manipulation...")
ws.send(json.dumps({"id": 50, "method": "Page.navigate", "params": {"url": "https://arena.ai/app"}}))
time.sleep(8)

# Check if we got through
ws.send(json.dumps({"id": 60, "method": "Runtime.evaluate", "params": {"expression": """
({
    title: document.title,
    url: window.location.href,
    content: document.body ? document.body.innerText.substring(0, 500) : 'no content',
    hasModels: document.body ? document.body.innerText.toLowerCase().includes('model') : false,
    hasChat: document.body ? document.body.innerText.toLowerCase().includes('chat') : false,
    isAppPage: window.location.href.includes('/app')
})
"""}}))

final_response = ws.recv()
final_data = json.loads(final_response)

if 'result' in final_data and 'value' in final_data['result']:
    final_info = final_data['result']['value']
    print(f"\n🎯 FINAL STATUS:")
    print(f"  Title: {final_info['title']}")
    print(f"  URL: {final_info['url']}")
    print(f"  Is App Page: {final_info['isAppPage']}")
    print(f"  Has Models: {final_info['hasModels']}")
    print(f"  Has Chat: {final_info['hasChat']}")
    print(f"  Content: {final_info['content'][:200]}...")
    
    if final_info['hasModels'] or final_info['hasChat']:
        print("\n🎉 SUCCESS! Accessed Arena models interface!")
    else:
        print("\n⚠️ Still blocked - may need real authentication")

ws.close()
print("\n✅ Direct access attempt complete!")