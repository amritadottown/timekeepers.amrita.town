import { useMemo } from "react"
import type { TimetableData } from "@/lib/timetable"
import { resolveSchedule } from "@/lib/timetable"

interface TimetableRendererProps {
  data: TimetableData | null
  configSelections: Record<string, string>
  onConfigChange: (key: string, value: string) => void
  error: string | null
}

interface CellData {
  value: string
  displayValue: string
  colSpan: number
}

function mergeCells(arr: string[]): CellData[] {
  const result: CellData[] = []
  for (const p of arr) {
    const last = result[result.length - 1]
    if (last && last.value === p) {
      last.colSpan++
    } else {
      result.push({
        value: p,
        displayValue: p === "FREE" ? "FREE" : p.replace(/_LAB$/, ""),
        colSpan: 1,
      })
    }
  }
  return result
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function TimetableRenderer({
  data,
  configSelections,
  onConfigChange,
  error,
}: TimetableRendererProps) {
  const resolvedSchedule = useMemo(() => {
    if (!data) return null
    try {
      return resolveSchedule(data.schedule, data.slots, configSelections)
    } catch {
      return null
    }
  }, [data, configSelections])

  const days = useMemo(() => {
    if (!data) return []
    return DAYS.filter((d) => d in (resolvedSchedule ?? data.schedule))
  }, [data, resolvedSchedule])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground text-sm">
          Paste a v2 timetable JSON on the left to render it here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
      {Object.keys(data.config).length > 0 && (
        <div className="flex flex-wrap gap-4 items-center">
          {Object.entries(data.config).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {config.label}:
              </label>
              <select
                className="text-xs border border-border rounded px-2 py-1 bg-background"
                value={configSelections[key] || config.values[0]?.id || ""}
                onChange={(e) => onConfigChange(key, e.target.value)}
              >
                {config.values.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm text-center">
          <thead>
            <tr className="bg-[#C9DAA6]">
              <th className="border border-border px-3 py-2 font-semibold" rowSpan={2}>
                Day
              </th>
              <th className="border border-border px-3 py-2 font-semibold" colSpan={3}>
                Morning
                <br /><span className="font-normal text-[11px]">8:10-10:40</span>
              </th>
              <th className="border border-border px-2 py-2 font-semibold" rowSpan={7} style={{ width: "5%" }}>
                <span className="[writing-mode:vertical-lr]">TEA BREAK</span>
              </th>
              <th className="border border-border px-3 py-2 font-semibold" colSpan={2}>
                Mid-day
                <br /><span className="font-normal text-[11px]">11:00-12:40</span>
              </th>
              <th className="border border-border px-2 py-2 font-semibold" rowSpan={7} style={{ width: "5%" }}>
                <span className="[writing-mode:vertical-lr]">LUNCH BREAK</span>
              </th>
              <th className="border border-border px-3 py-2 font-semibold" colSpan={2}>
                Afternoon
                <br /><span className="font-normal text-[11px]">2:00-3:40</span>
              </th>
            </tr>
            <tr className="bg-[#FFFE97]">
              <th className="border border-border px-3 py-1.5 text-sm font-medium">8:10-9:00</th>
              <th className="border border-border px-3 py-1.5 text-sm font-medium">9:00-9:50</th>
              <th className="border border-border px-3 py-1.5 text-sm font-medium">9:50-10:40</th>
              <th className="border border-border px-3 py-1.5 text-sm font-medium">11:00-11:50</th>
              <th className="border border-border px-3 py-1.5 text-sm font-medium">11:50-12:40</th>
              <th className="border border-border px-3 py-1.5 text-sm font-medium">2:00-2:50</th>
              <th className="border border-border px-3 py-1.5 text-sm font-medium">2:50-3:40</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const periods = resolvedSchedule?.[day] ?? []
              const morningCells = mergeCells(periods.slice(0, 3))
              const middayCells = mergeCells(periods.slice(3, 5))
              const afternoonCells = mergeCells(periods.slice(5, 7))

              return (
                <tr key={day}>
                  <td className="border border-border px-3 py-3 font-medium bg-muted/30">
                    {day}
                  </td>
                  {renderCells(morningCells)}
                  <td className="border border-border" />
                  {renderCells(middayCells)}
                  <td className="border border-border" />
                  {renderCells(afternoonCells)}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <h3 className="text-sm font-semibold mb-2">Subject Details</h3>
        <table className="w-full border-collapse border border-border text-sm text-center">
          <thead>
            <tr className="bg-[#C9DAA6]">
              <th className="border border-border px-3 py-1.5">Slot</th>
              <th className="border border-border px-3 py-1.5">Subject Code</th>
              <th className="border border-border px-3 py-1.5">L T P CR</th>
              <th className="border border-border px-3 py-1.5">Subject Title</th>
              <th className="border border-border px-3 py-1.5">Faculty</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.subjects).map(([key, subj]) => (
              <tr key={key}>
                <td className="border border-border px-3 py-1.5 font-medium">{key}</td>
                <td className="border border-border px-3 py-1.5">{subj.code}</td>
                <td className="border border-border px-3 py-1.5" />
                <td className="border border-border px-3 py-1.5 text-left">{subj.name}</td>
                <td className="border border-border px-3 py-1.5 text-left">{subj.faculty.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function renderCells(cells: CellData[]): React.ReactNode {
  return cells.map((c, i) => (
    <td
      key={i}
      colSpan={c.colSpan}
      className={`border border-border px-3 py-3 ${c.value === "FREE" ? "text-muted-foreground/50 italic" : ""}`}
    >
      {c.value === "FREE" ? "FREE" : c.displayValue}
    </td>
  ))
}
