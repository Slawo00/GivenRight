#!/usr/bin/env python3
import json
import websocket
import time

# Quick status check of current Arena page
ws = websocket.create_connection("ws://localhost:9222/devtools/page/4971B3D8CB199F40526DE9DB80FD2A86", timeout=3)

ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
time.sleep(1)

# Get current status
ws.send(json.dumps({"id": 10, "method": "Runtime.evaluate", "params": {"expression": """
JSON.stringify({
    title: document.title,
    url: window.location.href,
    readyState: document.readyState,
    hasModels: document.body ? document.body.innerText.toLowerCase().includes('model') : false,
    hasChat: document.body ? document.body.innerText.toLowerCase().includes('chat') : false,
    hasGPT: document.body ? document.body.innerText.toLowerCase().includes('gpt') : false,
    hasClaude: document.body ? document.body.innerText.toLowerCase().includes('claude') : false,
    bodyLength: document.body ? document.body.innerText.length : 0,
    firstLines: document.body ? document.body.innerText.split('\\n').slice(0, 10).join(' | ') : 'no body'
})
"""}}))

# Get the response
response = None
for _ in range(10):
    try:
        resp = ws.recv()
        data = json.loads(resp)
        if data.get('id') == 10:
            response = data
            break
    except:
        time.sleep(0.1)

if response and 'result' in response:
    try:
        status = json.loads(response['result']['value'])
        print("🎯 CURRENT ARENA STATUS:")
        print(f"  📄 Title: {status['title']}")
        print(f"  🌐 URL: {status['url']}")
        print(f"  ⚡ Ready: {status['readyState']}")
        print(f"  🤖 Has Models: {status['hasModels']}")
        print(f"  💬 Has Chat: {status['hasChat']}")
        print(f"  🔥 Has GPT: {status['hasGPT']}")
        print(f"  🧠 Has Claude: {status['hasClaude']}")
        print(f"  📝 Body Length: {status['bodyLength']}")
        print(f"  📋 First Lines: {status['firstLines'][:200]}...")
        
        if status['hasModels'] or status['hasGPT'] or status['hasClaude']:
            print("\n🎉 SUCCESS! Arena models are accessible!")
        else:
            print(f"\n⚠️ Models not visible - body length: {status['bodyLength']}")
    except Exception as e:
        print(f"Parse error: {e}")
        print(f"Raw: {response}")
else:
    print("❌ No response received")

ws.close()