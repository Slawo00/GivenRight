#!/usr/bin/env python3
import json
import websocket
import time

print("🎯 FIXED ARENA ACCESS")

ws = websocket.create_connection("ws://localhost:9222/devtools/page/4971B3D8CB199F40526DE9DB80FD2A86")

# Enable domains and consume setup responses
ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
ws.send(json.dumps({"id": 2, "method": "Page.enable"}))

# Consume setup responses
for i in range(5):
    try:
        resp = ws.recv()
        data = json.loads(resp)
        if data.get('id') in [1, 2]:  # Our commands
            print(f"Setup {data['id']}: OK")
    except:
        break

# Navigate and wait
print("📡 Loading Arena.ai...")
ws.send(json.dumps({"id": 10, "method": "Page.navigate", "params": {"url": "https://arena.ai"}}))

# Wait for navigation to complete
time.sleep(10)

# Now get page info
print("🔍 Getting page info...")
ws.send(json.dumps({"id": 20, "method": "Runtime.evaluate", "params": {"expression": "document.title"}}))

# Wait for our specific response
while True:
    try:
        resp = ws.recv()
        data = json.loads(resp)
        if data.get('id') == 20:  # Our title request
            title = data.get('result', {}).get('value', 'Unknown')
            print(f"📄 Title: {title}")
            break
    except:
        break

# Check for auth elements
print("🔐 Looking for auth...")
ws.send(json.dumps({"id": 21, "method": "Runtime.evaluate", "params": {"expression": """
document.body ? document.body.innerHTML.substring(0, 2000) : 'no body'
"""}}))

while True:
    try:
        resp = ws.recv()
        data = json.loads(resp)
        if data.get('id') == 21:
            content = data.get('result', {}).get('value', 'No content')
            
            has_signup = 'sign' in content.lower()
            has_login = 'login' in content.lower()
            has_clerk = 'clerk' in content.lower()
            
            print(f"🔐 Has Signup: {has_signup}")
            print(f"🔑 Has Login: {has_login}")
            print(f"⚡ Has Clerk: {has_clerk}")
            print(f"📝 Content length: {len(content)}")
            break
    except:
        break

# Try app access
print("🚀 Trying /app access...")
ws.send(json.dumps({"id": 30, "method": "Page.navigate", "params": {"url": "https://arena.ai/app"}}))
time.sleep(8)

ws.send(json.dumps({"id": 31, "method": "Runtime.evaluate", "params": {"expression": """
JSON.stringify({
    title: document.title,
    url: window.location.href,
    bodyText: document.body ? document.body.innerText.substring(0, 500) : 'no body',
    hasModel: document.body ? document.body.innerText.toLowerCase().includes('model') : false
})
"""}}))

while True:
    try:
        resp = ws.recv()
        data = json.loads(resp)
        if data.get('id') == 31:
            try:
                result = json.loads(data.get('result', {}).get('value', '{}'))
                print(f"\n🎯 APP ACCESS RESULT:")
                print(f"  Title: {result.get('title', 'Unknown')}")
                print(f"  URL: {result.get('url', 'Unknown')}")
                print(f"  Has Models: {result.get('hasModel', False)}")
                print(f"  Content: {result.get('bodyText', 'No content')[:200]}...")
                
                if result.get('hasModel'):
                    print("\n🎉 SUCCESS! Found model access!")
                else:
                    print("\n⚠️ No models found - likely auth required")
            except:
                raw_value = data.get('result', {}).get('value', 'No result')
                print(f"Raw result: {raw_value}")
            break
    except:
        break

ws.close()
print("\n✅ Analysis complete!")