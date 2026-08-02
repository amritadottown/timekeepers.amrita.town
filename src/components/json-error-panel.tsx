import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCopy } from "@/lib/use-copy"
import { Check, Copy, FileText, TriangleAlert } from "lucide-react"
import type { ValidationIssue } from "@/lib/validate"

interface JsonErrorPanelProps {
  syntaxError: string | null
  issues: ValidationIssue[]
}

const MAX_VISIBLE_ISSUES = 24

function buildFixPrompt(syntaxError: string | null, issues: ValidationIssue[]): string {
  if (syntaxError) {
    return [
      "The timetable JSON you generated for me has a syntax error.",
      "",
      `Error: ${syntaxError}`,
      "",
      "Paste the broken JSON into this chat, then reply with the complete corrected JSON and nothing else.",
    ].join("\n")
  }
  return [
    "The v2 timetable JSON you generated for me has these issues:",
    "",
    ...issues.map((issue) => `- ${issue.path}: ${issue.message}`),
    "",
    "Fix all of them and reply with the complete corrected JSON and nothing else.",
  ].join("\n")
}

export function JsonErrorPanel({ syntaxError, issues }: JsonErrorPanelProps) {
  const { copied, copy } = useCopy()
  const prompt = useMemo(() => buildFixPrompt(syntaxError, issues), [syntaxError, issues])
  const visibleIssues = issues.slice(0, MAX_VISIBLE_ISSUES)

  return (
    <div className="flex items-center justify-center h-full p-8 overflow-auto">
      <div className="max-w-xl w-full flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <TriangleAlert className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {syntaxError
                ? "This JSON doesn't parse"
                : `${issues.length} issue${issues.length === 1 ? "" : "s"} in this JSON`}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {syntaxError
                ? "Fix it and paste the corrected JSON back into the editor."
                : "The renderer can't display it yet. Copy the fix prompt into the same chat where you generated the JSON, then paste the corrected result back here."}
            </p>
          </div>
        </div>

        {!syntaxError && (
          <div className="rounded-lg border border-border divide-y divide-border">
            {visibleIssues.map((issue, i) => (
              <div key={i} className="px-3 py-2 flex gap-3 items-baseline">
                <span className="text-[10px] font-semibold text-destructive/70 shrink-0 w-6 text-right tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <code className="text-[11px] font-mono text-foreground/70">{issue.path}</code>
                  <p className="text-[13px] text-muted-foreground">{issue.message}</p>
                </div>
              </div>
            ))}
            {issues.length > MAX_VISIBLE_ISSUES && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                …and {issues.length - MAX_VISIBLE_ISSUES} more
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <FileText className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium flex-1">Fix prompt</span>
          </div>
          <ScrollArea className="h-44 font-mono text-[11px] leading-relaxed">
            <div className="p-3 whitespace-pre-wrap text-foreground/80">{prompt}</div>
          </ScrollArea>
          <div className="p-3 border-t border-border">
            <Button className="w-full" onClick={() => copy(prompt)} disabled={copied}>
              {copied ? (
                <>
                  <Check className="size-3.5" /> Copied — paste it into the chat
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy the fix prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
