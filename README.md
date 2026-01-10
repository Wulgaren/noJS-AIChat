# No-JS AI Chatbot for Netlify (Kindle-Friendly)

A simple AI chatbot using Google Gemini 2.5 Flash that works without JavaScript on the client - perfect for Kindle's Experimental Browser! Hosted free on Netlify.

## Features

- ✅ **Zero client-side JavaScript** - Pure HTML forms, works on Kindle
- ✅ **Free hosting** - Netlify free tier
- ✅ **Free AI** - Gemini API free tier
- ✅ **Conversation memory** - Chat history preserved via form data
- ✅ **High contrast** - E-ink friendly design

## Deploy to Netlify

### 1. Get a Free Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### 2. Deploy to Netlify

1. Fork/clone this repo to your GitHub
2. Go to [netlify.com](https://netlify.com) and sign up/log in
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub and select the repo
5. Click "Add environment variables"
   - Key: `GEMINI_API_KEY`
   - Value: *your API key from step 1*
6. Click "Deploy"

### 3. Access on Kindle

1. Open the Experimental Browser on your Kindle
2. Navigate to your Netlify URL (e.g., `https://your-site.netlify.app`)
3. Start chatting!

## How It Works

The chat interface uses pure HTML forms - no JavaScript runs in the browser. The serverless function on Netlify:

1. Receives form submission with message + chat history
2. Calls Gemini API with full conversation context
3. Returns a fresh HTML page with the response
4. Chat history is stored in a hidden form field

## Project Structure

```
├── netlify/
│   └── functions/
│       └── chat.js       # Serverless function
├── public/
│   └── index.html        # Redirect to function
├── netlify.toml          # Netlify config
├── package.json          # Dependencies
└── README.md
```

## Free Tier Limits

| Service | Free Allowance |
|---------|----------------|
| Netlify | 125k function invocations/month |
| Gemini | 1,500 requests/day |

Plenty for personal use!

## Tips for Kindle

- The Kindle browser is slow - be patient after clicking Send
- Keep messages concise for faster responses
- The high-contrast black/white design is optimized for e-ink
