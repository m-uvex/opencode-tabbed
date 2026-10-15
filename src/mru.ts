export interface TabItem {
  readonly sessionID: string
  readonly title?: string
  readonly active: boolean
  readonly busy?: boolean
  readonly attention?: boolean
  readonly unread?: "activity" | "error"
}

export interface MruOptions {
  readonly timeout?: number
  readonly showToast?: boolean
}

export interface CycleResult {
  readonly targetID: string
  readonly index: number
  readonly total: number
}

export class MruTracker {
  private stack: string[] = []
  private cycling = false
  private cycleIndex = 0
  private lastActiveSessionID: string | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private readonly timeout: number

  constructor(options?: MruOptions) {
    this.timeout = options?.timeout ?? 800
  }

  sync(tabs: readonly TabItem[]): void {
    const openSet = new Set(tabs.map((t) => t.sessionID))
    this.stack = this.stack.filter((id) => openSet.has(id))

    for (const tab of tabs) {
      if (!this.stack.includes(tab.sessionID)) {
        this.stack.push(tab.sessionID)
      }
    }

    if (!this.cycling) {
      const activeTab = tabs.find((t) => t.active)
      if (activeTab && activeTab.sessionID !== this.lastActiveSessionID) {
        this.lastActiveSessionID = activeTab.sessionID
        this.touch(activeTab.sessionID)
      }
    }

    if (this.cycleIndex >= this.stack.length) {
      this.cycleIndex = Math.max(0, this.stack.length - 1)
    }
  }

  touch(sessionID: string): void {
    this.lastActiveSessionID = sessionID
    const idx = this.stack.indexOf(sessionID)
    if (idx !== -1) {
      this.stack.splice(idx, 1)
    }
    this.stack.unshift(sessionID)
  }

  next(tabs: readonly TabItem[], direction: 1 | -1 = 1): CycleResult | null {
    this.sync(tabs)

    if (this.stack.length <= 1) {
      return null
    }

    if (!this.cycling) {
      this.cycling = true
      this.cycleIndex = direction === 1 ? 1 : this.stack.length - 1
    } else {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      this.cycleIndex = (this.cycleIndex + direction + this.stack.length) % this.stack.length
    }

    const targetID = this.stack[this.cycleIndex]

    this.timer = setTimeout(() => {
      this.commit()
    }, this.timeout)

    return {
      targetID,
      index: this.cycleIndex,
      total: this.stack.length,
    }
  }

  commit(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (!this.cycling) return

    this.cycling = false
    const chosenID = this.stack[this.cycleIndex]
    if (chosenID) {
      this.touch(chosenID)
    }
    this.cycleIndex = 0
  }

  reset(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.cycling = false
    this.cycleIndex = 0
  }

  ordered(tabs: readonly TabItem[]): TabItem[] {
    this.sync(tabs)
    const map = new Map(tabs.map((t) => [t.sessionID, t]))
    const result: TabItem[] = []
    for (const id of this.stack) {
      const tab = map.get(id)
      if (tab) result.push(tab)
    }
    return result
  }

  isCycling(): boolean {
    return this.cycling
  }

  getStack(): readonly string[] {
    return this.stack
  }
}
