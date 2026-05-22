<img src="assets/icon.png" width="96" height="96" alt="AI Ask" />

# Paprika

A personal browser extension for quick bookmark/tab search and prompt template injection into page input fields.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+I` (macOS) / `Ctrl+I` (Windows) | Open command palette — search tabs, bookmarks, run commands |
| Type `/t` in any input field | Open prompt selector — search and insert custom prompt templates |
| `Escape` | Close current panel |

## Prompt Injection (`/t`)

Type `/t` in any text input or textarea on a page to trigger:

- A floating search panel appears with saved prompt templates
- Filter prompts by name, content, or tags
- Select a prompt → `/t` is replaced by the prompt content, inserted at cursor position
- Press `Escape` or click outside to dismiss — `/t` is also removed

## Prompt Management

Click "Prompt Manager" in the extension popup to open the management page. Supports creating, editing, and deleting prompts, with tag-based classification and full-text search.

## Todo

**Context Menu**: Right-click on any page to trigger "Post Summary" or "Comment Summary" AI features.
