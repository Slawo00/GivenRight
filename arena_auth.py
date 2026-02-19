#!/usr/bin/env python3
import json
import requests
import time
import websocket
import re

class ArenaAuth:
    def __init__(self):
        self.tab_id = "4971B3D8CB199F40526DE9DB80FD2A86" 
        self.ws_url = f"ws://localhost:9222/devtools/page/{self.tab_id}"
        self.ws = None
        
    def connect(self):
        try:
            self.ws = websocket.create_connection(self.ws_url, timeout=10)
            # Enable domains
            self.ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            self.ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
            self.ws.send(json.dumps({"id": 3, "method": "Network.enable"}))
            
            # Clear responses
            for _ in range(5):
                try: self.ws.recv()
                except: break
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def send_command(self, method, params=None):
        if not self.ws:
            return None
        
        cmd_id = int(time.time() * 1000)
        command = {"id": cmd_id, "method": method, "params": params or {}}
        self.ws.send(json.dumps(command))
        
        try:
            response = self.ws.recv()
            return json.loads(response)
        except:
            return None
    
    def navigate_and_wait(self, url, wait_time=8):
        print(f"🌐 Navigating to: {url}")
        self.send_command("Page.navigate", {"url": url})
        time.sleep(wait_time)
    
    def get_page_info(self):
        result = self.send_command("Runtime.evaluate", {"expression": """
        JSON.stringify({
            title: document.title,
            url: window.location.href,
            readyState: document.readyState,
            hasSignup: document.body ? document.body.innerHTML.toLowerCase().includes('sign') : false,
            hasLogin: document.body ? document.body.innerHTML.toLowerCase().includes('login') : false,
            buttons: Array.from(document.querySelectorAll('button, [role="button"], a[href*="sign"], a[href*="login"]')).map(el => ({
                text: el.textContent.trim(),
                href: el.href || '',
                onClick: el.onclick ? 'has-click' : 'no-click',
                className: el.className
            })),
            forms: Array.from(document.forms).map(form => ({
                action: form.action,
                method: form.method,
                inputs: Array.from(form.querySelectorAll('input')).map(input => ({
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder
                }))
            }))
        })
        """})
        
        if result and 'result' in result and 'value' in result['result']:
            return json.loads(result['result']['value'])
        return None
    
    def find_auth_flow(self):
        print("🔍 SCANNING FOR AUTH FLOW...")
        
        # Check main page
        self.navigate_and_wait("https://arena.ai")
        info = self.get_page_info()
        
        if info:
            print(f"📄 Title: {info['title']}")
            print(f"🔐 Has Signup: {info['hasSignup']}")
            print(f"🔑 Has Login: {info['hasLogin']}")
            
            print("\n🔘 Auth-related buttons found:")
            auth_buttons = [btn for btn in info['buttons'] if any(keyword in btn['text'].lower() 
                           for keyword in ['sign', 'login', 'register', 'start', 'get started', 'join'])]
            
            for btn in auth_buttons[:10]:
                print(f"  • '{btn['text']}' -> {btn['href']}")
                
            # Try to click signup/login buttons
            for btn in auth_buttons:
                if 'sign' in btn['text'].lower() or 'start' in btn['text'].lower():
                    if btn['href']:
                        print(f"\n🎯 Following signup link: {btn['href']}")
                        self.navigate_and_wait(btn['href'], 10)
                        return self.check_auth_page()
                    else:
                        print(f"\n🎯 Clicking signup button: {btn['text']}")
                        self.click_element_by_text(btn['text'])
                        time.sleep(5)
                        return self.check_auth_page()
        
        # Try direct auth routes
        auth_routes = [
            "https://arena.ai/signup",
            "https://arena.ai/sign-up", 
            "https://arena.ai/register",
            "https://arena.ai/auth/signup",
            "https://arena.ai/login",
            "https://clerk.arena.ai",
            "https://arena.ai/app" # App might redirect to auth
        ]
        
        for route in auth_routes:
            print(f"\n🔍 Trying auth route: {route}")
            self.navigate_and_wait(route, 6)
            
            auth_info = self.get_page_info()
            if auth_info and (auth_info['hasSignup'] or auth_info['hasLogin'] or len(auth_info['forms']) > 0):
                print(f"🎉 Found auth page at: {route}")
                return self.check_auth_page()
        
        return False
    
    def check_auth_page(self):
        info = self.get_page_info()
        if not info:
            return False
            
        print(f"\n📋 Auth Page Analysis:")
        print(f"  Title: {info['title']}")
        print(f"  URL: {info['url']}")
        print(f"  Forms: {len(info['forms'])}")
        
        # Look for OAuth buttons
        oauth_buttons = [btn for btn in info['buttons'] if any(provider in btn['text'].lower() 
                        for provider in ['google', 'github', 'microsoft', 'continue with'])]
        
        if oauth_buttons:
            print(f"\n🔗 OAuth Options Found:")
            for btn in oauth_buttons:
                print(f"  • {btn['text']} -> {btn['href']}")
                
            # Try Google OAuth first
            google_btn = next((btn for btn in oauth_buttons if 'google' in btn['text'].lower()), None)
            if google_btn:
                return self.attempt_oauth(google_btn)
        
        # Look for email signup forms
        if info['forms']:
            print(f"\n📝 Signup Forms Found:")
            for i, form in enumerate(info['forms']):
                print(f"  Form {i+1}: {form['action']} ({form['method']})")
                for inp in form['inputs']:
                    print(f"    - {inp['type']}: {inp['name']} ({inp['placeholder']})")
                    
            return self.attempt_email_signup(info['forms'][0] if info['forms'] else None)
        
        return False
    
    def attempt_oauth(self, oauth_btn):
        print(f"\n🔗 Attempting OAuth: {oauth_btn['text']}")
        
        if oauth_btn['href']:
            self.navigate_and_wait(oauth_btn['href'])
        else:
            self.click_element_by_text(oauth_btn['text'])
            time.sleep(3)
        
        # Check if we're now on OAuth provider page
        current_info = self.get_page_info()
        if current_info:
            print(f"🌐 Current page: {current_info['title']} - {current_info['url']}")
            
            # If we're on Google OAuth, we'd need actual credentials
            if 'google' in current_info['url'].lower():
                print("🔐 Reached Google OAuth - would need real credentials")
                print("🔄 Returning to explore other options...")
                self.navigate_and_wait("https://arena.ai")
                return False
                
        return True
    
    def attempt_email_signup(self, form):
        print("\n📧 Attempting email signup with temporary email...")
        
        # Generate temporary email
        temp_email = f"test_{int(time.time())}@tempmail.org"
        temp_password = "TestPassword123!"
        
        print(f"📧 Using email: {temp_email}")
        
        # Fill form
        if form and form['inputs']:
            email_input = next((inp for inp in form['inputs'] if inp['type'] == 'email'), None)
            password_input = next((inp for inp in form['inputs'] if inp['type'] == 'password'), None)
            
            if email_input:
                self.fill_input(email_input['name'], temp_email)
            if password_input:
                self.fill_input(password_input['name'], temp_password)
                
            # Submit form
            self.submit_form()
            time.sleep(5)
            
            # Check result
            result_info = self.get_page_info()
            if result_info:
                print(f"📋 Signup result: {result_info['title']} - {result_info['url']}")
                
                # Check if we're now logged in or need email verification
                if 'verify' in result_info['url'].lower() or 'confirm' in result_info['title'].lower():
                    print("📨 Email verification required - checking for alternatives...")
                    return False
                elif 'app' in result_info['url'].lower() or 'dashboard' in result_info['url'].lower():
                    print("🎉 Successfully signed up and logged in!")
                    return True
        
        return False
    
    def fill_input(self, name, value):
        self.send_command("Runtime.evaluate", {"expression": f"""
        const input = document.querySelector('input[name="{name}"]') || 
                     document.querySelector('input[type="email"]') ||
                     document.querySelector('input[placeholder*="email"]');
        if (input) {{
            input.value = '{value}';
            input.dispatchEvent(new Event('input', {{bubbles: true}}));
            input.dispatchEvent(new Event('change', {{bubbles: true}}));
        }}
        """})
    
    def submit_form(self):
        self.send_command("Runtime.evaluate", {"expression": """
        const form = document.querySelector('form');
        const submitBtn = document.querySelector('button[type="submit"]') || 
                         document.querySelector('input[type="submit"]') ||
                         document.querySelector('button:contains("Sign")');
        if (submitBtn) {
            submitBtn.click();
        } else if (form) {
            form.submit();
        }
        """})
    
    def click_element_by_text(self, text):
        self.send_command("Runtime.evaluate", {"expression": f"""
        const elements = Array.from(document.querySelectorAll('*'));
        const target = elements.find(el => el.textContent.trim() === '{text}');
        if (target) target.click();
        """})
    
    def close(self):
        if self.ws:
            self.ws.close()

def main():
    print("🚀 ARENA.AI AUTHENTICATION ATTEMPT")
    
    auth = ArenaAuth()
    if auth.connect():
        print("✅ Connected to browser")
        
        if auth.find_auth_flow():
            print("🎉 Authentication flow completed!")
            
            # Try to access Explorer now
            auth.navigate_and_wait("https://arena.ai/app")
            final_info = auth.get_page_info()
            if final_info:
                print(f"\n🎯 FINAL RESULT:")
                print(f"  Title: {final_info['title']}")
                print(f"  URL: {final_info['url']}")
                
                if 'model' in final_info['title'].lower() or 'explorer' in final_info['url'].lower():
                    print("🎊 SUCCESS! Arena Explorer is now accessible!")
                else:
                    print("⚠️  Still not in Explorer - may need manual verification")
        else:
            print("❌ Could not complete authentication flow")
            
        auth.close()
    else:
        print("❌ Failed to connect to browser")

if __name__ == "__main__":
    main()