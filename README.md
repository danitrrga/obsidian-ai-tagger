# AI Auto Tagger for Obsidian

Automatically suggest and add tags to your Obsidian notes using AI. The plugin analyzes your note content and selects the most relevant tags from your existing tag collection — it never invents new tags.

## Features

- **AI-powered tagging** — Uses free models via OpenRouter (Nemotron, MiniMax) to analyze note content
- **Strict tag validation** — Only suggests tags from your existing tag files, never creates new ones
- **Interactive tag selection** — Review suggestions in a modal and toggle individual tags before applying
- **Auto-insert mode** — Optionally skip the confirmation dialog for faster workflows
- **Configurable** — Set max tags (1–10), choose your tags folder, and adjust behavior

## Setup

### 1. Get an OpenRouter API key

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create a free account and generate an API key
3. The plugin uses free models (e.g., `nvidia/nemotron-3-super-120b-a12b:free`) — no charges apply

### 2. Prepare your tags folder

Create a folder in your vault where each file represents a tag. For example:

```
Tags/
├── project-alpha.md
├── meeting-notes.md
├── machine-learning.md
├── personal.md
└── research.md
```

The filename (without extension) becomes the tag name.

### 3. Configure the plugin

1. Open Obsidian Settings → Community Plugins → AI Auto Tagger
2. Set the **Tags folder path** (e.g., `Tags` or `Utility/MyTags`)
3. Paste your **OpenRouter API key**
4. Adjust **Max tags** if desired (default: 5)

## Usage

1. Open the note you want to tag
2. Click the **tag icon** in the left ribbon, or use the command palette: **"Run AI Auto Tagger"**
3. Review the suggested tags in the dialog — click any tag to deselect it
4. Click **Add Tags** to insert them into your note

Tags are inserted as a `Tags:` line with `[[wiki-link]]` format. If one already exists, it gets updated in place.

## Installation

### Manual

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder: `<vault>/.obsidian/plugins/ai-auto-tagger-plugin/`
3. Copy the files into that folder
4. Enable the plugin in Obsidian settings

### From source

```bash
git clone https://github.com/danitrrga/ai-auto-tagger.git
cd ai-auto-tagger
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder.

## How it works

The plugin sends your note content (truncated to ~6000 characters) and your tag list to OpenRouter's chat API. The AI model returns a JSON response with selected tags. The plugin validates every suggested tag against your allowed list before showing it to you — nothing outside your tag collection can be applied.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "OpenRouter API key not configured" | Add your key in plugin settings |
| "No tag files found" | Check that your tags folder path is correct and contains files |
| "Invalid API key" | Verify your key at [openrouter.ai/keys](https://openrouter.ai/keys) |
| "Rate limit exceeded" | Wait a moment and try again — the free tier has usage limits |
| "Network error" | Check your internet connection |
| No relevant tags found | Your note content may not match your existing tag categories |

## License

MIT
