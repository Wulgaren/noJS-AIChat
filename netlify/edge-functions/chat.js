import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { marked } from "https://esm.sh/marked@15.0.6";

export default async (request, context) => {
  let history = [];
  let error = null;

  // Handle POST request
  if (request.method === "POST") {
    const formData = await request.formData();

    // Check for clear action
    if (formData.has("clear")) {
      history = [];
    } else {
      // Restore history from hidden field
      try {
        history = JSON.parse(formData.get("history") || "[]");
      } catch {
        history = [];
      }

      // Get new message
      const userMessage = (formData.get("message") || "").trim();

      if (userMessage) {
        try {
          const apiKey = Deno.env.get("GEMINI_API_KEY");
          if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
          }

          // Initialize Gemini with Google Search grounding
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: "gemini-3.0-flash",
            tools: [{ googleSearch: {} }]
          });

          // Build conversation history for Gemini
          const chatHistory = history.flatMap((msg) => [
            { role: "user", parts: [{ text: msg.user }] },
            { role: "model", parts: [{ text: msg.bot }] },
          ]);

          // Start chat with history
          const chat = model.startChat({ history: chatHistory });

          // Send message
          const result = await chat.sendMessage(userMessage);
          const botResponse = result.response.text();

          // Add to history
          history.push({
            user: userMessage,
            bot: botResponse,
          });
        } catch (e) {
          error = e.message;
        }
      }
    }
  }

  // Generate HTML
  const html = generateHTML(history, error);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const config = { path: "/" };

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseMarkdown(text) {
  // Configure marked for safety
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true,    // GitHub Flavored Markdown
  });
  return marked.parse(text);
}

function generateHTML(history, error) {
  let messagesHtml = "";
  if (history.length > 0) {
    for (const msg of history) {
      const userText = escapeHtml(msg.user);
      const botText = parseMarkdown(msg.bot);
      messagesHtml += `<div class="message user-msg">${userText}</div>\n`;
      messagesHtml += `<div class="message bot-msg"><div class="markdown-content">${botText}</div></div>\n`;
    }
  } else {
    messagesHtml = '<p class="empty">No messages yet. Start chatting!</p>';
  }

  const errorHtml = error
    ? `<div class="error">${escapeHtml(error)}</div>`
    : "";

  const historyJson = escapeHtml(JSON.stringify(history));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: Georgia, serif;
            font-size: 18px;
            line-height: 1.5;
            background: #fff;
            color: #000;
            max-width: 600px;
            margin: 0 auto;
            padding: 10px;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
        }
        .chat-box {
            margin-bottom: 20px;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #000;
            word-wrap: break-word;
        }
        .user-msg {
            background: #f0f0f0;
        }
        .user-msg::before {
            content: "You: ";
            font-weight: bold;
        }
        .bot-msg {
            background: #fff;
        }
        .bot-msg::before {
            content: "AI: ";
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        form {
            margin-bottom: 10px;
        }
        textarea {
            width: 100%;
            height: 80px;
            font-size: 18px;
            font-family: Georgia, serif;
            padding: 8px;
            border: 2px solid #000;
            margin-bottom: 10px;
        }
        button {
            font-size: 18px;
            padding: 10px 20px;
            background: #000;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .clear-btn {
            background: #666;
        }
        .error {
            background: #ffcccc;
            border: 2px solid #cc0000;
            padding: 10px;
            margin-bottom: 15px;
        }
        .empty {
            color: #666;
            font-style: italic;
            margin-bottom: 15px;
        }
        /* Markdown styles */
        .markdown-content {
            overflow-wrap: break-word;
        }
        .markdown-content p {
            margin-bottom: 10px;
        }
        .markdown-content p:last-child {
            margin-bottom: 0;
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3,
        .markdown-content h4, .markdown-content h5, .markdown-content h6 {
            margin: 15px 0 10px 0;
            font-weight: bold;
        }
        .markdown-content h1 { font-size: 1.4em; }
        .markdown-content h2 { font-size: 1.3em; }
        .markdown-content h3 { font-size: 1.2em; }
        .markdown-content code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.9em;
        }
        .markdown-content pre {
            background: #f4f4f4;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 10px 0;
        }
        .markdown-content pre code {
            background: none;
            padding: 0;
        }
        .markdown-content ul, .markdown-content ol {
            margin: 10px 0;
            padding-left: 25px;
        }
        .markdown-content li {
            margin-bottom: 5px;
        }
        .markdown-content blockquote {
            border-left: 3px solid #ccc;
            margin: 10px 0;
            padding-left: 15px;
            color: #555;
        }
        .markdown-content a {
            color: #0066cc;
        }
        .markdown-content table {
            border-collapse: collapse;
            margin: 10px 0;
            width: 100%;
        }
        .markdown-content th, .markdown-content td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
        }
        .markdown-content th {
            background: #f4f4f4;
        }
        .markdown-content hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 15px 0;
        }
        /* Larger fonts for smaller devices like Kindle */
        @media (max-width: 600px) {
            body {
                font-size: 22px;
            }
            h1 {
                font-size: 28px;
            }
            textarea {
                font-size: 22px;
            }
            button {
                font-size: 22px;
                padding: 12px 24px;
            }
            .markdown-content h1 { font-size: 1.5em; }
            .markdown-content h2 { font-size: 1.4em; }
            .markdown-content h3 { font-size: 1.3em; }
        }
    </style>
</head>
<body>
    <h1>AI Chat</h1>
    
    ${errorHtml}
    
    <div class="chat-box">
        ${messagesHtml}
    </div>
    
    <form method="POST" id="chatform">
        <input type="hidden" name="history" value="${historyJson}">
        <textarea name="message" placeholder="Type your message..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.form.submit()}"></textarea>
        <br>
        <button type="submit">Send</button>
        <button type="submit" name="clear" value="1" class="clear-btn">Clear Chat</button>
    </form>
</body>
</html>`;
}
