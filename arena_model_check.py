#!/usr/bin/env python3
import json
import websocket
import time

print("🔍 CHECKING FOR OPUS 4.6 ON ARENA.AI")

ws = websocket.create_connection("ws://localhost:9222/devtools/page/4971B3D8CB199F40526DE9DB80FD2A86")
ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
time.sleep(1)

# Search for all model mentions on the page
ws.send(json.dumps({"id": 10, "method": "Runtime.evaluate", "params": {"expression": """
JSON.stringify({
    url: window.location.href,
    title: document.title,
    fullText: document.body ? document.body.innerText : '',
    htmlContent: document.body ? document.body.innerHTML : '',
    hasOpus: document.body ? document.body.innerText.toLowerCase().includes('opus') : false,
    hasClaude: document.body ? document.body.innerText.toLowerCase().includes('claude') : false,
    hasGPT: document.body ? document.body.innerText.toLowerCase().includes('gpt') : false,
    allModels: []
})
"""}}))

# Wait for response
for _ in range(10):
    try:
        resp = ws.recv()
        data = json.loads(resp)
        if data.get('id') == 10:
            try:
                result = json.loads(data['result']['value'])
                print(f"📍 Current URL: {result['url']}")
                print(f"📄 Title: {result['title']}")
                print(f"🤖 Has Opus: {result['hasOpus']}")
                print(f"🧠 Has Claude: {result['hasClaude']}")  
                print(f"🔥 Has GPT: {result['hasGPT']}")
                
                text = result['fullText'].lower()
                html = result['htmlContent'].lower()
                
                # Search for specific model mentions
                models_found = []
                model_keywords = [
                    'opus', 'claude', 'gpt-4', 'gpt-5', 'gemini', 'llama', 
                    'mixtral', 'command', 'qwen', 'deepseek', 'anthropic', 'openai'
                ]
                
                for keyword in model_keywords:
                    if keyword in text or keyword in html:
                        models_found.append(keyword)
                
                print(f"📋 Models Found: {', '.join(models_found) if models_found else 'None detected'}")
                print(f"📝 Page Text Length: {len(result['fullText'])}")
                
                # Show first 300 chars of content
                content_preview = result['fullText'][:300] if result['fullText'] else 'No content'
                print(f"📖 Content Preview: {content_preview}")
                
                # Specifically look for Opus 4.6
                if 'opus' in text and '4.6' in text:
                    print("\n🎯 OPUS 4.6 CONFIRMED ON PAGE!")
                elif 'opus' in text:
                    print(f"\n⚡ OPUS found but checking version...")
                    # Look for version numbers near opus
                    opus_context = []
                    words = text.split()
                    for i, word in enumerate(words):
                        if 'opus' in word:
                            context = ' '.join(words[max(0,i-3):i+4])
                            opus_context.append(context)
                    print(f"🔍 Opus contexts: {opus_context}")
                else:
                    print("\n❌ No Opus mentions found")
                
            except Exception as e:
                print(f"Parse error: {e}")
                print(f"Raw response: {data}")
            break
    except Exception as e:
        print(f"WebSocket error: {e}")
        time.sleep(0.1)

# Try clicking to navigate to actual model selection
print("\n🎯 Attempting to access model selection...")
ws.send(json.dumps({"id": 20, "method": "Runtime.evaluate", "params": {"expression": """
(() => {
    // Look for buttons that might lead to model selection
    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    const modelButtons = buttons.filter(btn => 
        btn.textContent.toLowerCase().includes('model') ||
        btn.textContent.toLowerCase().includes('chat') ||
        btn.textContent.toLowerCase().includes('compare') ||
        btn.textContent.toLowerCase().includes('start')
    );
    
    if (modelButtons.length > 0) {
        // Click the first promising button
        modelButtons[0].click();
        return `Clicked: "${modelButtons[0].textContent.trim()}"`;
    }
    
    return 'No model buttons found';
})()
"""}}))

# Get click result
click_resp = ws.recv()
click_data = json.loads(click_resp)
if click_data.get('id') == 20:
    click_result = click_data.get('result', {}).get('value', 'No result')
    print(f"Click result: {click_result}")

time.sleep(5)

# Check new page state
ws.send(json.dumps({"id": 30, "method": "Runtime.evaluate", "params": {"expression": """
JSON.stringify({
    url: window.location.href,
    hasOpus: document.body ? document.body.innerText.toLowerCase().includes('opus') : false,
    content: document.body ? document.body.innerText.substring(0, 500) : ''
})
"""}}))

final_resp = ws.recv()
final_data = json.loads(final_resp)
if final_data.get('id') == 30:
    try:
        final_result = json.loads(final_data['result']['value'])
        print(f"\n🔄 After click:")
        print(f"📍 URL: {final_result['url']}")
        print(f"🤖 Has Opus: {final_result['hasOpus']}")
        print(f"📝 Content: {final_result['content']}")
    except:
        print(f"Final result: {final_data}")

ws.close()
print("\n✅ Model check complete!")