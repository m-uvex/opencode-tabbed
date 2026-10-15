import { Plugin } from "@opencode/plugin/tui"
import { MruTracker, type TabItem } from "./mru.js"

export interface PluginOptions {
  readonly timeout?: number
  readonly showToast?: boolean
  readonly bindCycle?: string
  readonly bindCycleBack?: string
}

export default Plugin.define({
  id: "opencode-tabbed",
  setup(context: Plugin.Context) {
    const rawOptions = (context.options ?? {}) as PluginOptions
    const options: PluginOptions = {
      timeout: typeof rawOptions.timeout === "number" ? rawOptions.timeout : 800,
      showToast: rawOptions.showToast !== false,
      bindCycle: typeof rawOptions.bindCycle === "string" ? rawOptions.bindCycle : "ctrl+tab,alt+down",
      bindCycleBack: typeof rawOptions.bindCycleBack === "string" ? rawOptions.bindCycleBack : "ctrl+shift+tab,alt+up",
    }

    const tracker = new MruTracker({
      timeout: options.timeout,
      showToast: options.showToast,
    })

    function cycle(direction: 1 | -1): false | void {
      if (!context.ui.tabs.enabled()) return false

      const tabs: readonly TabItem[] = context.ui.tabs.list()
      if (tabs.length <= 1) return false

      const result = tracker.next(tabs, direction)
      if (!result) return false

      const success = context.ui.tabs.focus(result.targetID)
      if (!success) {
        tracker.reset()
        return false
      }

      if (options.showToast) {
        const targetTab = tabs.find((t: TabItem) => t.sessionID === result.targetID)
        const title = targetTab?.title || "Untitled Session"
        context.ui.toast.show({
          title: "Tabs",
          message: `${result.index + 1}/${result.total}: ${title}`,
          duration: options.timeout ?? 800,
        })
      }
    }

    async function openSwitcher(): Promise<void> {
      if (!context.ui.tabs.enabled()) return
      const tabs: readonly TabItem[] = context.ui.tabs.list()
      if (tabs.length === 0) return

      const ordered = tracker.ordered(tabs)
      const currentTab = tabs.find((t: TabItem) => t.active)

      const optionsList = ordered.map((tab: TabItem) => {
        const isCurrent = tab.sessionID === currentTab?.sessionID
        const flags: string[] = []
        if (tab.busy) flags.push("busy")
        if (tab.unread) flags.push(`unread: ${tab.unread}`)
        return {
          title: tab.title || "Untitled Session",
          value: tab.sessionID,
          description: flags.length > 0 ? flags.join(", ") : undefined,
          category: isCurrent ? "Active" : "Open Tabs",
        }
      })

      const defaultSelection = ordered.length > 1 ? ordered[1].sessionID : ordered[0].sessionID

      const selected = await context.ui.dialog.select({
        title: "Switch Tab",
        options: optionsList,
        current: defaultSelection,
      })

      if (selected) {
        context.ui.tabs.focus(selected)
        tracker.touch(selected)
      }
    }

    const cycleKeys = (options.bindCycle || "ctrl+tab,alt+down")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    const cycleBackKeys = (options.bindCycleBack || "ctrl+shift+tab,alt+up")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    const primaryCycle = cycleKeys[0] || "ctrl+tab"
    const primaryCycleBack = cycleBackKeys[0] || "ctrl+shift+tab"

    context.keymap.layer(() => ({
      mode: "global",
      priority: 100,
      commands: [
        {
          id: "tabbed.cycle",
          title: "Cycle tabs (MRU)",
          group: "Tabs",
          bind: primaryCycle,
          palette: true,
          run: () => cycle(1),
        },
        ...cycleKeys.slice(1).map((key) => ({
          bind: key,
          run: () => cycle(1),
        })),
        {
          id: "tabbed.cycle-back",
          title: "Cycle tabs backward (MRU)",
          group: "Tabs",
          bind: primaryCycleBack,
          palette: true,
          run: () => cycle(-1),
        },
        ...cycleBackKeys.slice(1).map((key) => ({
          bind: key,
          run: () => cycle(-1),
        })),
        {
          id: "tabbed.switcher",
          title: "Switch tab from list",
          group: "Tabs",
          slash: { name: "tabs", aliases: ["tabswitch"] },
          palette: true,
          run: () => openSwitcher(),
        },
      ],
      bindings: ["tabbed.cycle", "tabbed.cycle-back"],
    }))

    return () => {
      tracker.reset()
    }
  },
})
