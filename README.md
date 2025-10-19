FocusFlow: ADHD & Dyslexia Friendly Reader
FocusFlow is a Chrome extension designed to make web content more accessible for users with ADHD and Dyslexia. It uses AI models from Hugging Face to simplify and reformat selected text on any webpage.

✨ Core Features
ADHD Mode: Summarizes long or complex passages of text into concise, easy-to-digest key points. This helps users grasp the main ideas without getting overwhelmed.

Dyslexia Mode: Rewrites selected text using simpler sentence structures and vocabulary. The output is then displayed in the OpenDyslexic font, a typeface specifically designed to improve readability for users with dyslexia.

⚙️ How It Works
The extension works by:

Capturing the text you highlight on a webpage.

Sending the text to the Hugging Face AI Inference API for processing.

ADHD Mode uses the facebook/bart-large-cnn model for text summarization.

Dyslexia Mode uses the sshleifer/distilbart-cnn-12-6 model with a custom prompt to rewrite text in a simple, dyslexia-friendly format.

Displaying the simplified or summarized text back to you in the extension's popup window.

🚀 Installation and Setup
To use this extension locally, follow these steps:

1. Clone the Repository

Bash

git clone <your-repository-url>
cd <your-repository-directory>
2. Get a Hugging Face API Key The extension requires a Hugging Face API key to function.

Go to the Hugging Face website and create a free account.

Navigate to your profile, then go to Settings > Access Tokens.

Create a new token with read permissions.

3. Add Your API Key

Open the config.js file in the project folder.

Replace the placeholder key with the key you just created.

JavaScript

// In config.js
const HUGGINGFACE_API_KEY = "hf_YourActualApiKeyGoesHere";
⚠️ Important Security Note: The config.js file is intended for your local use. Do not commit your personal Hugging Face API key to a public repository. If you plan to push changes, ensure config.js is added to your .gitignore file.

4. Load the Extension in Chrome

Open Google Chrome and navigate to chrome://extensions.

Enable the "Developer mode" toggle, usually in the top-right corner.

Click on the "Load unpacked" button.

Select the folder where you cloned the repository.

The FocusFlow extension icon should now appear in your browser's toolbar.

📖 Usage
Navigate to any webpage with text you want to simplify.

Highlight the text with your mouse.

Click the FocusFlow extension icon in your toolbar.

Choose either ADHD Mode or Dyslexia Mode.

Click the action button (Simplify Selected Text or Convert Selected Text).

The processed text will appear in the output box.

📁 Project Structure
/
├── manifest.json       # Defines the extension's properties, permissions, and entry points.
├── popup.html          # The HTML structure for the extension's popup UI.
├── styles.css          # All styles for the popup, including the dyslexia-friendly font definition.
├── popup.js            # The main JavaScript logic for the UI, text processing, and API calls.
├── content.js          # A content script used to get the selected text from the active webpage.
├── config.js           # Configuration file to store the Hugging Face API key.
└── OpenDyslexic-Italic.woff2 # The font file used for the Dyslexia Mode display.
