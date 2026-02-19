#!/usr/bin/env python3
import json
import websocket
import time

# Ultra-simple auth attempt
print("🔥 SIMPLE ARENA AUTH")

ws = websocket.create_connection("ws://localhost:9222/devtools/page/4971B3D8CB199F40526DE9DB80FD2A86", timeout=5)

# Enable
ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
ws.send(json.dumps({"id": 2, "method": "Page.enable"}))

# Navigate
print("Loading Arena...")
ws.send(json.dumps({"id": 3, "method": "Page.navigate", "params": {"url": "https://arena.ai"}}))
time.sleep(8)

# Check current state
ws.send(json.dumps({"id": 4, "method": "Runtime.evaluate", "params": {"expression": "document.title + ' | ' + window.location.href"}}))
title_resp = ws.recv()
print(f"Current: {title_resp}")

# Look for auth buttons
ws.send(json.dumps({"id": 5, "method": "Runtime.evaluate", "params": {"expression": """
Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && (
        el.textContent.toLowerCase().includes('sign') ||
        el.textContent.toLowerCase().includes('login') ||
        el.textContent.toLowerCase().includes('start') ||
        el.textContent.toLowerCase().includes('get started')
    )
).map(el => ({
    tag: el.tagName,
    text: el.textContent.trim(),
    href: el.href || 'no-href'
})).slice(0, 5)
"""}}))

buttons_resp = ws.recv()
print(f"Auth buttons: {buttons_resp}")

# Try direct app access
print("Trying direct /app...")
ws.send(json.dumps({"id": 6, "method": "Page.navigate", "params": {"url": "https://arena.ai/app"}}))
time.sleep(6)

ws.send(json.dumps({"id": 7, "method": "Runtime.evaluate", "params": {"expression": "document.title + ' | ' + document.body.innerText.substring(0, 200)"}}))
app_resp = ws.recv()
print(f"App result: {app_resp}")

ws.close()
print("Done!")