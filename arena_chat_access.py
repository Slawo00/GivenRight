#!/usr/bin/env python3
import json
import websocket
import time

print("🎯 ARENA CHAT ACCESS - CLICKING START NEW CHAT")

ws = websocket.create_connection("ws://localhost:9222/devtools/page/4971B3D8CB199F40526DE9DB80FD2A86")
ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
time.sleep(1)

# Click "Start New Chat"
print("🔥 Clicking 'Start New Chat'...")
ws.send(json.dumps({"id": 10, "method": "Runtime.evaluate", "params": {"expression": """
(() => {
    const buttons = Array.from(document.querySelectorAll('*'));
    const chatBtn = buttons.find(el => el.textContent.includes('Start New Chat'));
    if (chatBtn) {
        chatBtn.click();
        return 'Chat button clicked!';
    }
    return 'Chat button not found';
})()
"""}}))

# Wait for response
resp = ws.recv()
data = json.loads(resp)
if data.get('id') == 10:
    result = data.get('result', {}).get('value', 'No result')
    print(f"Click result: {result}")

time.sleep(3)

# Check new state
print("📊 Checking post-click state...")
ws.send(json.dumps({"id": 20, "method": "Runtime.evaluate", "params": {"expression": """
JSON.stringify({
    url: window.location.href,
    title: document.title,
    hasModels: document.body.innerText.toLowerCase().includes('model'),
    hasGPT: document.body.innerText.toLowerCase().includes('gpt'),
    hasClaude: document.body.innerText.toLowerCase().includes('claude'),
    hasSelect: document.body.innerText.toLowerCase().includes('select'),
    content: document.body.innerText.substring(0, 800)
})
"""}}))

# Get response
for _ in range(10):
    resp = ws.recv() 
    data = json.loads(resp)
    if data.get('id') == 20:
        try:
            status = json.loads(data['result']['value'])
            print(f"\n🎯 AFTER CLICKING CHAT:")
            print(f"  🌐 URL: {status['url']}")
            print(f"  📄 Title: {status['title']}")
            print(f"  🤖 Has Models: {status['hasModels']}")
            print(f"  🔥 Has GPT: {status['hasGPT']}")
            print(f"  🧠 Has Claude: {status['hasClaude']}")
            print(f"  🎛️ Has Select: {status['hasSelect']}")
            print(f"  📝 Content:\n{status['content']}")
            
            if status['hasModels'] or status['hasGPT'] or status['hasClaude']:
                print("\n🎉 MODELS FOUND! Arena chat interface active!")
            else:
                print("\n⚠️ Still no models visible")
        except Exception as e:
            print(f"Parse error: {e}")
        break

# Also try clicking "View Leaderboard"
print("\n📊 Trying 'View Leaderboard'...")
ws.send(json.dumps({"id": 30, "method": "Runtime.evaluate", "params": {"expression": """
(() => {
    const buttons = Array.from(document.querySelectorAll('*'));
    const leaderBtn = buttons.find(el => el.textContent.includes('View Leaderboard'));
    if (leaderBtn) {
        leaderBtn.click();
        return 'Leaderboard clicked!';
    }
    return 'Leaderboard not found';
})()
"""}}))

resp = ws.recv()
data = json.loads(resp)
if data.get('id') == 30:
    result = data.get('result', {}).get('value', 'No result')
    print(f"Leaderboard click: {result}")

time.sleep(3)

# Final check
ws.send(json.dumps({"id": 40, "method": "Runtime.evaluate", "params": {"expression": "window.location.href + ' | ' + document.title"}}))
resp = ws.recv() 
data = json.loads(resp)
if data.get('id') == 40:
    final = data.get('result', {}).get('value', 'Unknown')
    print(f"\n🏁 Final location: {final}")

ws.close()
print("\n✅ Arena chat access attempt complete!")