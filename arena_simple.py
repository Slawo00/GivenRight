#!/usr/bin/env python3
import json
import requests
import time
import websocket

# Direct WebSocket approach
tab_id = "4971B3D8CB199F40526DE9DB80FD2A86"
ws_url = f"ws://localhost:9222/devtools/page/{tab_id}"

print("Connecting to Arena.ai...")
ws = websocket.create_connection(ws_url)

# Enable domains
ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
ws.send(json.dumps({"id": 3, "method": "Network.enable"}))

# Navigate to Arena.ai
print("Loading Arena.ai...")
ws.send(json.dumps({"id": 4, "method": "Page.navigate", "params": {"url": "https://arena.ai"}}))

# Wait for responses
for i in range(10):
    try:
        response = ws.recv()
        data = json.loads(response)
        print(f"Response {i+1}: {data}")
    except Exception as e:
        break

time.sleep(8)

# Get page content
print("\nGetting page content...")
ws.send(json.dumps({"id": 10, "method": "Runtime.evaluate", "params": {"expression": "document.title"}}))
title_response = ws.recv()
print(f"Title: {title_response}")

ws.send(json.dumps({"id": 11, "method": "Runtime.evaluate", "params": {"expression": "document.body ? document.body.innerHTML.substring(0, 1000) : 'No body'"}}))
content_response = ws.recv()
print(f"Content: {content_response}")

# Look for Explorer
ws.send(json.dumps({"id": 12, "method": "Runtime.evaluate", "params": {"expression": "Array.from(document.links).map(l => ({text: l.textContent, href: l.href})).filter(l => l.text.toLowerCase().includes('explorer') || l.href.includes('explorer'))"}}))
explorer_response = ws.recv()
print(f"Explorer links: {explorer_response}")

ws.close()
print("\nDone!")