import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

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

          // Initialize Gemini
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

function generateHTML(history, error) {
  let messagesHtml = "";
  if (history.length > 0) {
    for (const msg of history) {
      const userText = escapeHtml(msg.user);
      const botText = escapeHtml(msg.bot).replace(/\n/g, "<br>");
      messagesHtml += `<div class="message user-msg">${userText}</div>\n`;
      messagesHtml += `<div class="message bot-msg">${botText}</div>\n`;
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
    </style>
</head>
<body>
    <h1>AI Chat</h1>
    
    ${errorHtml}
    
    <div class="chat-box">
        ${messagesHtml}
    </div>
    
    <form method="POST">
        <input type="hidden" name="history" value="${historyJson}">
        <textarea name="message" placeholder="Type your message..."></textarea>
        <br>
        <button type="submit">Send</button>
        <button type="submit" name="clear" value="1" class="clear-btn">Clear Chat</button>
    </form>
</body>
</html>`;
}
