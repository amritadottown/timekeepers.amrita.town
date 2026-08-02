import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowDown, Check, ChevronDown, Copy, FileText, Loader2 } from "lucide-react"

const PROMPT_URL =
  "https://raw.githubusercontent.com/amritadottown/timetable-registry/main/tutorial.md"

export function Onboarding() {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<number | null>(null)

  const loadPrompt = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(PROMPT_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPrompt(await res.text())
    } catch {
      setError("Couldn't load the prompt. Check your connection and retry.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrompt()
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    }
  }, [loadPrompt])

  const handleCopy = useCallback(async () => {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = prompt
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
  }, [prompt])

  const scrollToTool = useCallback(() => {
    document.getElementById("tool")?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div className="h-dvh flex flex-col overflow-y-auto">
      <header className="flex items-center gap-2 px-6 py-4 shrink-0">
        <h1 className="text-sm font-semibold">Timekeepers</h1>
        <span className="text-xs text-muted-foreground">amrita.town · timetable registry</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-8 min-h-0">
        <div className="max-w-2xl w-full text-center">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-4">
            Timetable transcription
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Transcribe. Verify.
          </h2>
          <p className="text-sm text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
            Turn your timetable PDF or photo into registry JSON with an AI assistant, then check
            the render against the original.
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-xl w-full">
          <Card>
            <div className="px-4 py-4 flex flex-col gap-3.5">
              <div className="flex items-baseline gap-3">
                <span className="text-[11px] font-semibold tracking-widest text-muted-foreground">
                  01
                </span>
                <h3 className="text-sm font-semibold">Generate the JSON</h3>
              </div>
              <ol className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
                <li>
                  <span className="text-foreground/60 font-medium">1.</span> Open{" "}
                  <span className="font-medium text-foreground">Gemini</span> or{" "}
                  <span className="font-medium text-foreground">Claude</span> in a new tab.
                </li>
                <li>
                  <span className="text-foreground/60 font-medium">2.</span> Attach your
                  timetable — a photo or PDF works.
                </li>
                <li>
                  <span className="text-foreground/60 font-medium">3.</span> Copy the prompt
                  below, paste it into the chat, and send.
                </li>
                <li>
                  <span className="text-foreground/60 font-medium">4.</span> Copy the JSON the
                  assistant returns and move to step two.
                </li>
              </ol>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                  <FileText className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium flex-1">Transcription prompt</span>
                  {loading && <Loader2 className="size-3.5 text-muted-foreground animate-spin" />}
                  {prompt && (
                    <Button variant="ghost" size="xs" onClick={() => setShowPrompt((v) => !v)}>
                      {showPrompt ? "Hide" : "View"}
                    </Button>
                  )}
                </div>
                <div className="p-3">
                  {loading ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="h-2 w-full bg-muted animate-pulse rounded" />
                      <div className="h-2 w-4/5 bg-muted animate-pulse rounded" />
                      <div className="h-2 w-3/5 bg-muted animate-pulse rounded" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-destructive flex-1">{error}</span>
                      <Button variant="outline" size="sm" onClick={loadPrompt}>
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={handleCopy}
                      disabled={!prompt}
                    >
                      {copied ? (
                        <>
                          <Check className="size-3.5" /> Copied — paste it into the chat
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" /> Copy the prompt
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {showPrompt && prompt && (
                  <ScrollArea className="h-56 border-t border-border font-mono text-[11px] leading-relaxed">
                    <div className="p-3 whitespace-pre-wrap">{prompt}</div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-4 py-4 flex flex-col gap-3.5">
              <div className="flex items-baseline gap-3">
                <span className="text-[11px] font-semibold tracking-widest text-muted-foreground">
                  02
                </span>
                <h3 className="text-sm font-semibold">Verify against the source</h3>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Paste the JSON into the editor and load your timetable image in the reference
                panel. The renderer draws every period — compare it cell by cell against the
                original.
              </p>
              <Button variant="secondary" className="self-start" onClick={scrollToTool}>
                Open the editor <ArrowDown className="size-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <footer className="shrink-0 pb-5 flex flex-col items-center gap-1.5 text-muted-foreground">
        <ChevronDown className="size-4 animate-bounce" />
        <span className="text-[11px]">Scroll for the tool</span>
      </footer>
    </div>
  )
}
