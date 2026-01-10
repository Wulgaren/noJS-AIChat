import os
import json
import html
from urllib.parse import parse_qs
from google import genai

def handler(event, context):
    """Serverless function that returns full HTML page (no JS needed)"""
    
    history = []
    error = None
    
    # Handle POST request
    if event.get("httpMethod") == "POST":
        body = event.get("body", "")
        
        # Parse form data
        if event.get("isBase64Encoded"):
            import base64
            body = base64.b64decode(body).decode("utf-8")
        
        params = parse_qs(body)
        
        # Check for clear action
        if "clear" in params:
            history = []
        else:
            # Restore history from hidden field
            history_json = params.get("history", ["[]"])[0]
            try:
                history = json.loads(history_json)
            except:
                history = []
            
            # Get new message
            user_message = params.get("message", [""])[0].strip()
            
            if user_message:
                try:
                    # Initialize Gemini client
                    api_key = os.environ.get("GEMINI_API_KEY")
                    if not api_key:
                        raise Exception("GEMINI_API_KEY not configured")
                    
                    client = genai.Client(api_key=api_key)
                    
                    # Build conversation context
                    contents = []
                    for msg in history:
                        contents.append({"role": "user", "parts": [{"text": msg["user"]}]})
                        contents.append({"role": "model", "parts": [{"text": msg["bot"]}]})
                    contents.append({"role": "user", "parts": [{"text": user_message}]})
                    
                    # Call Gemini API
                    response = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=contents
                    )
                    
                    bot_response = response.text
                    
                    # Add to history
                    history.append({
                        "user": user_message,
                        "bot": bot_response
                    })
                    
                except Exception as e:
                    error = str(e)
    
    # Generate HTML
    html_content = generate_html(history, error)
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/html; charset=utf-8"
        },
        "body": html_content
    }

def generate_html(history, error):
    """Generate the full HTML page"""
    
    # Build chat messages HTML
    messages_html = ""
    if history:
        for msg in history:
            user_text = html.escape(msg["user"])
            bot_text = html.escape(msg["bot"]).replace("\n", "<br>")
            messages_html += f'<div class="message user-msg">{user_text}</div>\n'
            messages_html += f'<div class="message bot-msg">{bot_text}</div>\n'
    else:
        messages_html = '<p class="empty">No messages yet. Start chatting!</p>'
    
    # Error HTML
    error_html = ""
    if error:
        error_html = f'<div class="error">{html.escape(error)}</div>'
    
    # Serialize history for hidden field
    history_json = html.escape(json.dumps(history))
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat</title>
    <style>
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: Georgia, serif;
            font-size: 18px;
            line-height: 1.5;
            background: #fff;
            color: #000;
            max-width: 600px;
            margin: 0 auto;
            padding: 10px;
        }}
        h1 {{
            font-size: 24px;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
        }}
        .chat-box {{
            margin-bottom: 20px;
        }}
        .message {{
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #000;
            word-wrap: break-word;
        }}
        .user-msg {{
            background: #f0f0f0;
        }}
        .user-msg::before {{
            content: "You: ";
            font-weight: bold;
        }}
        .bot-msg {{
            background: #fff;
        }}
        .bot-msg::before {{
            content: "AI: ";
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }}
        form {{
            margin-bottom: 10px;
        }}
        textarea {{
            width: 100%;
            height: 80px;
            font-size: 18px;
            font-family: Georgia, serif;
            padding: 8px;
            border: 2px solid #000;
            margin-bottom: 10px;
        }}
        button {{
            font-size: 18px;
            padding: 10px 20px;
            background: #000;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-right: 10px;
            margin-bottom: 10px;
        }}
        .clear-btn {{
            background: #666;
        }}
        .error {{
            background: #ffcccc;
            border: 2px solid #cc0000;
            padding: 10px;
            margin-bottom: 15px;
        }}
        .empty {{
            color: #666;
            font-style: italic;
            margin-bottom: 15px;
        }}
    </style>
</head>
<body>
    <h1>AI Chat</h1>
    
    {error_html}
    
    <div class="chat-box">
        {messages_html}
    </div>
    
    <form method="POST" action="/.netlify/functions/chat">
        <input type="hidden" name="history" value="{history_json}">
        <textarea name="message" placeholder="Type your message..."></textarea>
        <br>
        <button type="submit">Send</button>
        <button type="submit" name="clear" value="1" class="clear-btn">Clear Chat</button>
    </form>
</body>
</html>'''
