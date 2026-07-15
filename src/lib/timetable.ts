export interface Subject {
  name: string
  code: string
  faculty: string[]
  shortName: string
}

export interface ConfigValue {
  id: string
  label: string
}

export interface ConfigOption {
  label: string
  values: ConfigValue[]
}

export type Slot =
  | { match: string; choices: Record<string, string> }
  | { match: string[]; choices: { pattern: string[]; value: string }[] }

export type Schedule = Record<string, string[]>

export interface TimetableData {
  $schema?: string
  subjects: Record<string, Subject>
  config: Record<string, ConfigOption>
  slots: Record<string, Slot>
  schedule: Schedule
}

export const TIME_SLOTS = [
  { label: "8:10-9:00", span: 1 },
  { label: "9:00-9:50", span: 1 },
  { label: "9:50-10:40", span: 1 },
]

export const LAB_SLOTS = [
  { label: "8:10-10:25", span: 3 },
  { label: "10:50-1:05", span: 2 },
  { label: "1:25-3:40", span: 2 },
]

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export function getOrderedDays(schedule: Schedule): string[] {
  return DAY_ORDER.filter((d) => d in schedule)
}

function getRank(day: string): number {
  const idx = DAY_ORDER.indexOf(day)
  return idx === -1 ? 999 : idx
}

export function sortDays(days: string[]): string[] {
  return [...days].sort((a, b) => getRank(a) - getRank(b))
}

export function resolveSlot(
  slot: Slot,
  configSelections: Record<string, string>,
): () => string {
  if (Array.isArray(slot.match)) {
    const multiSlot = slot as { match: string[]; choices: { pattern: string[]; value: string }[] }
    for (const choice of multiSlot.choices) {
      const match = choice.pattern.every((p, i) => {
        if (p === "*") return true
        return configSelections[multiSlot.match[i]] === p
      })
      if (match) return () => choice.value
    }
    return () => "FREE"
  }

  const simpleSlot = slot as { match: string; choices: Record<string, string> }
  const configValue = configSelections[simpleSlot.match]
  if (configValue && simpleSlot.choices[configValue]) {
    return () => simpleSlot.choices[configValue]
  }
  return () => "FREE"
}

export function resolvePeriod(
  period: string,
  slots: Record<string, Slot>,
  configSelections: Record<string, string>,
): string {
  if (period === "FREE") return "FREE"
  if (slots[period]) {
    return resolveSlot(slots[period], configSelections)()
  }
  return period
}

export function resolveSchedule(
  schedule: Schedule,
  slots: Record<string, Slot>,
  configSelections: Record<string, string>,
): Schedule {
  const resolved: Schedule = {}
  for (const [day, periods] of Object.entries(schedule)) {
    resolved[day] = periods.map((p) => resolvePeriod(p, slots, configSelections))
  }
  return resolved
}

export function isLab(entry: string): boolean {
  return entry.endsWith("_LAB")
}

export function getBaseSubjectKey(entry: string): string {
  if (entry.endsWith("_LAB")) return entry.slice(0, -4)
  return entry
}

export function getSubjectColor(key: string): string {
  const colors = [
    "#E8F5E9", "#E3F2FD", "#FFF3E0", "#F3E5F5",
    "#E0F7FA", "#FBE9E7", "#F1F8E9", "#EDE7F6",
    "#E8EAF6", "#FCE4EC", "#E0F2F1", "#FFF8E1",
    "#EFEBE9", "#F9FBE7", "#E1F5FE", "#F3E5F5",
  ]
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export interface MergedCell {
  value: string
  span: number
  subjectKey: string | null
}

export function mergePeriods(periods: string[]): MergedCell[] {
  const merged: MergedCell[] = []
  for (const p of periods) {
    const last = merged[merged.length - 1]
    if (last && last.value === p) {
      last.span++
    } else {
      merged.push({
        value: p,
        span: 1,
        subjectKey: p === "FREE" ? null : getBaseSubjectKey(p),
      })
    }
  }
  return merged
}
