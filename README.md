# opencode-tabbed

> Fast, intuitive MRU tab switching for OpenCode, just like Alt+Tab.

A tab management plugin for [OpenCode](https://opencode.ai) v2. Instead of cycling linearly through tabs in fixed order, `opencode-tabbed` tracks your most recently used sessions so you can instantly toggle between your active workspaces.

---

## Why You Need This

Standard terminal tabs cycle in fixed sequence: Tab 1 → Tab 2 → Tab 3 → Tab 4.

If you are working across two sessions (like editing code in Tab 1 and checking server logs in Tab 4), cycling tabs forces you to hop through every open tab in between. When you want to flip back, you have to cycle all the way around again.

`opencode-tabbed` brings the familiar Alt+Tab behavior from your operating system and code editor into OpenCode. Pressing `Ctrl+Tab` once toggles straight back to your last active tab, and pressing it again returns to where you started.

---

## What It Does

* **True MRU cycling:** `Ctrl+Tab` switches immediately to your previously focused session. Press it again to flip right back.
* **Step deeper on rapid taps:** Keep tapping to walk deeper through your recent history (`Tab 2 of 4`, `Tab 3 of 4`). Pausing briefly commits your selection to the top of the stack.
* **Reverse cycling:** Press `Ctrl+Shift+Tab` (or `Alt+Up`) to cycle backwards through your recent tab stack.
* **Interactive tab switcher:** Type `/tabs` or open the Command Palette to bring up a fuzzy-searchable tab picker showing session titles, active state, and busy or unread status.
* **Terminal-friendly fallbacks:** Ships pre-configured for both `Ctrl+Tab` and `Alt+Down` / `Alt+Up`, ensuring smooth navigation even in terminal emulators (like Kitty) that reserve `Ctrl+Tab` for themselves.
* **Clean visual feedback:** Displays a minimal, non-intrusive position indicator while cycling so you always know where you are landing.

---

## Installation

Built for OpenCode v2, no v1 support.

### Option 1: Just ask OpenCode (easiest)
Paste this into your active session:
```text
Install the plugin m-uvex/opencode-tabbed from github.
```

### Option 2: Using the CLI
Run this in your terminal:
```bash
opencode plugin add github:m-uvex/opencode-tabbed
```

### Option 3: Add to your config
Add this to your global config (`~/.config/opencode/cli.json` or `opencode.jsonc`):
```json
{
  "plugins": ["github:m-uvex/opencode-tabbed"]
}
```

---

## Configuration

Custom options can be passed in `cli.json`:

```json
{
  "plugins": [
    {
      "package": "github:m-uvex/opencode-tabbed",
      "options": {
        "timeout": 800,
        "showToast": true,
        "bindCycle": "ctrl+tab,alt+down",
        "bindCycleBack": "ctrl+shift+tab,alt+up"
      }
    }
  ]
}
```

| Option | Default | Description |
|---|---|---|
| `timeout` | `800` | Milliseconds of idle time before committing the selected tab to top of MRU. |
| `showToast` | `true` | Show a brief toast indicator during cycling with the current index and tab title. |
| `bindCycle` | `"ctrl+tab,alt+down"` | Keybinding(s) for cycling forward in MRU order. |
| `bindCycleBack` | `"ctrl+shift+tab,alt+up"` | Keybinding(s) for cycling backward in MRU order. |

---

## License

MIT
