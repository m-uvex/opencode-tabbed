import { describe, expect, it } from "bun:test"
import { MruTracker, type TabItem } from "../src/mru.js"

describe("MruTracker", () => {
  const makeTab = (sessionID: string, active = false, title = sessionID): TabItem => ({
    sessionID,
    active,
    title,
  })

  it("returns null when zero or one tab exists", () => {
    const tracker = new MruTracker({ timeout: 100 })
    expect(tracker.next([])).toBeNull()
    expect(tracker.next([makeTab("t1", true)])).toBeNull()
  })

  it("toggles between two tabs like Alt+Tab", async () => {
    const tracker = new MruTracker({ timeout: 50 })
    const tabsA = [makeTab("t1", true), makeTab("t2", false)]

    const first = tracker.next(tabsA, 1)
    expect(first).not.toBeNull()
    expect(first?.targetID).toBe("t2")
    expect(first?.index).toBe(1)

    await new Promise((r) => setTimeout(r, 60))
    expect(tracker.isCycling()).toBe(false)
    expect(tracker.getStack()).toEqual(["t2", "t1"])

    const tabsB = [makeTab("t1", false), makeTab("t2", true)]
    const second = tracker.next(tabsB, 1)
    expect(second?.targetID).toBe("t1")
    expect(second?.index).toBe(1)

    await new Promise((r) => setTimeout(r, 60))
    expect(tracker.getStack()).toEqual(["t1", "t2"])
  })

  it("cycles across multiple tabs when pressed rapidly", async () => {
    const tracker = new MruTracker({ timeout: 100 })
    const tabs = [makeTab("t1", true), makeTab("t2", false), makeTab("t3", false)]

    const step1 = tracker.next(tabs, 1)
    expect(step1?.targetID).toBe("t2")
    expect(tracker.isCycling()).toBe(true)

    const step2 = tracker.next(tabs, 1)
    expect(step2?.targetID).toBe("t3")

    const step3 = tracker.next(tabs, 1)
    expect(step3?.targetID).toBe("t1")

    await new Promise((r) => setTimeout(r, 120))
    expect(tracker.isCycling()).toBe(false)
    expect(tracker.getStack()).toEqual(["t1", "t2", "t3"])
  })

  it("cycles backwards when direction is -1", async () => {
    const tracker = new MruTracker({ timeout: 100 })
    const tabs = [makeTab("t1", true), makeTab("t2", false), makeTab("t3", false)]

    const step1 = tracker.next(tabs, -1)
    expect(step1?.targetID).toBe("t3")

    const step2 = tracker.next(tabs, -1)
    expect(step2?.targetID).toBe("t2")

    await new Promise((r) => setTimeout(r, 120))
    expect(tracker.getStack()).toEqual(["t2", "t1", "t3"])
  })

  it("prunes closed tabs and syncs new tabs", () => {
    const tracker = new MruTracker()
    tracker.sync([makeTab("t1", true), makeTab("t2", false), makeTab("t3", false)])
    expect(tracker.getStack()).toEqual(["t1", "t2", "t3"])

    tracker.sync([makeTab("t1", true), makeTab("t3", false), makeTab("t4", false)])
    expect(tracker.getStack()).toEqual(["t1", "t3", "t4"])
  })

  it("returns ordered tabs matching MRU order", () => {
    const tracker = new MruTracker()
    const tabsA = [makeTab("t1", true), makeTab("t2", false), makeTab("t3", false)]
    tracker.sync(tabsA)

    const tabsB = [makeTab("t1", false), makeTab("t2", false), makeTab("t3", true)]
    const ordered = tracker.ordered(tabsB)
    expect(ordered.map((t) => t.sessionID)).toEqual(["t3", "t1", "t2"])
  })
})
