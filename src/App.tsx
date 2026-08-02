import { useState, useCallback, useRef, useEffect } from "react"
import { JsonEditor } from "@/components/json-editor"
import { TimetableRenderer } from "@/components/timetable-renderer"
import { ImageUpload } from "@/components/image-upload"
import { Onboarding } from "@/components/onboarding"
import { JsonErrorPanel } from "@/components/json-error-panel"
import { validateTimetable, type ValidationIssue } from "@/lib/validate"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Maximize2, Minimize2 } from "lucide-react"
import type { TimetableData } from "@/lib/timetable"

function App() {
  const [jsonText, setJsonText] = useState("")
  const [parsedData, setParsedData] = useState<TimetableData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [isEditorOpen, setIsEditorOpen] = useState(true)
  const [isImagePanelOpen, setIsImagePanelOpen] = useState(true)
  const [configSelections, setConfigSelections] = useState<Record<string, string>>({})
  const [imagePanelWidth, setImagePanelWidth] = useState(320)
  const [showABSwap, setShowABSwap] = useState(false)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const resizingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const parseJson = useCallback((text: string) => {
    setJsonText(text)
    if (!text.trim()) {
      setParsedData(null)
      setParseError(null)
      setIssues([])
      return
    }
    try {
      const parsed = JSON.parse(text)
      const result = validateTimetable(parsed)
      if (!result.ok) {
        setParsedData(null)
        setParseError(null)
        setIssues(result.issues)
        return
      }
      setParsedData(parsed as TimetableData)
      setParseError(null)
      setIssues([])
      const selections: Record<string, string> = {}
      const config = (parsed as TimetableData).config
      for (const [key, option] of Object.entries(config)) {
        selections[key] = option.values[0]?.id || ""
      }
      setConfigSelections(selections)
    } catch (e) {
      setParsedData(null)
      setParseError(e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : String(e))
      setIssues([])
    }
  }, [])

  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        parseJson(text)
      }
      reader.readAsText(file)
    },
    [parseJson],
  )

  const handleConfigChange = useCallback(
    (key: string, value: string) => {
      setConfigSelections((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleMouseDown = useCallback(() => {
    resizingRef.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = Math.max(200, Math.min(600, rect.width - e.clientX + rect.left - 4))
      setImagePanelWidth(newWidth)
    }
    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = false
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isImagePanelOpen, imagePanelWidth])

  const toggleImagePanel = useCallback(() => {
    setIsImagePanelOpen((prev) => !prev)
  }, [])

  return (
    <div className="h-dvh overflow-y-auto snap-y snap-mandatory">
      <section className="h-dvh snap-start shrink-0">
        <Onboarding />
      </section>
      <section id="tool" className="h-dvh snap-start shrink-0">
        <div className="flex h-dvh w-full">
          <JsonEditor
            json={jsonText}
            onChange={parseJson}
            onFileUpload={handleFileUpload}
            isOpen={isEditorOpen}
            onToggle={() => setIsEditorOpen(!isEditorOpen)}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="border-b border-border px-4 py-2 flex items-center gap-2 shrink-0 bg-background">
              <h1 className="text-sm font-semibold">Timekeepers</h1>
              <span className="text-xs text-muted-foreground flex-1">
                amrita.town timetable renderer
              </span>
              {!isImagePanelOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => setShowABSwap((prev) => !prev)}
                >
                  {showABSwap ? (
                    <><Minimize2 className="size-3" /> Show Timetable</>
                  ) : (
                    <><Maximize2 className="size-3" /> Compare with Image</>
                  )}
                </Button>
              )}
            </header>
            <div ref={containerRef} className="flex-1 flex min-h-0">
              <div
                className={`min-h-0 overflow-auto ${
                  showABSwap && !isImagePanelOpen ? "hidden" : "flex-1"
                }`}
              >
                {parseError || issues.length > 0 ? (
                  <JsonErrorPanel syntaxError={parseError} issues={issues} />
                ) : (
                  <TimetableRenderer
                    data={parsedData}
                    configSelections={configSelections}
                    onConfigChange={handleConfigChange}
                  />
                )}
              </div>
              {showABSwap && !isImagePanelOpen && (
                <div className="flex-1 min-h-0 overflow-auto p-4">
                  <ImageUpload
                    label="Reference Timetable"
                    file={referenceFile}
                    onFileChange={setReferenceFile}
                  />
                </div>
              )}
              {isImagePanelOpen && (
                <>
                  <div
                    className="w-1.5 shrink-0 cursor-col-resize bg-border hover:bg-primary/30 active:bg-primary/50 transition-colors"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    className="shrink-0 overflow-auto border-l border-border"
                    style={{ width: imagePanelWidth }}
                  >
                    <div className="flex items-center justify-between p-2 border-b border-border">
                      <span className="text-sm font-medium">Reference</span>
                      <Button variant="ghost" size="sm" className="size-7" onClick={toggleImagePanel}>
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                    <div className="p-3">
                      <ImageUpload
                        label="Upload Timetable Image/PDF"
                        file={referenceFile}
                        onFileChange={setReferenceFile}
                      />
                    </div>
                  </div>
                </>
              )}
              {!isImagePanelOpen && (
                <div className="flex items-center border-l border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 rounded-none"
                    onClick={toggleImagePanel}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
