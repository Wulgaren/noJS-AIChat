# No-JS AI Chatbot for Netlify (Kindle-Friendly)

A simple AI chatbot using Google Gemini 2.5 Flash that works without JavaScript - perfect for Kindle's Experimental Browser! Hosted free on Netlify.

## Features

- ✅ **Zero JavaScript** - Pure HTML forms, works on Kindle
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

#### Option A: Deploy via GitHub (Recommended)

1. Push this code to a GitHub repository
2. Go to [netlify.com](https://netlify.com) and sign up/log in
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub and select the repo
5. In Build settings, leave defaults
6. Click "Add environment variables"
   - Key: `GEMINI_API_KEY`
   - Value: *your API key from step 1*
7. Click "Deploy"

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (from project directory)
netlify deploy --prod

# Set environment variable
netlify env:set GEMINI_API_KEY "your-api-key-here"
```

### 3. Access on Kindle

1. Open the Experimental Browser on your Kindle
2. Navigate to your Netlify URL (e.g., `https://your-site.netlify.app`)
3. Start chatting!

## How It Works

Since Netlify runs serverless functions (not persistent servers), the chat history is stored in a hidden form field. Each time you send a message:

1. The form submits the message + chat history to the function
2. The function calls Gemini API with full conversation context
3. The function returns a new HTML page with updated history
4. No JavaScript needed!

## Project Structure

```
├── netlify/
│   └── functions/
│       └── chat.py      # Serverless function
├── public/
│   └── index.html       # Redirect to function
├── netlify.toml         # Netlify config
├── requirements.txt     # Python dependencies
└── README.md
```

## Gemini Free Tier Limits

- 15 requests per minute
- 1 million tokens per minute  
- 1,500 requests per day

More than enough for personal use!

## Netlify Free Tier Limits

- 125,000 function invocations/month
- 100 hours of function runtime/month

Also plenty for personal use!

## Tips for Kindle

- The Kindle browser is slow - be patient after clicking Send
- Keep messages concise for faster responses
- The high-contrast black/white design is optimized for e-ink
