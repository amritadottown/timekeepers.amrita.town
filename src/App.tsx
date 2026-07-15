import { useState, useCallback, useRef, useEffect } from "react"
import { JsonEditor } from "@/components/json-editor"
import { TimetableRenderer } from "@/components/timetable-renderer"
import { ImageUpload } from "@/components/image-upload"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Maximize2, Minimize2 } from "lucide-react"
import type { TimetableData } from "@/lib/timetable"

function App() {
  const [jsonText, setJsonText] = useState("")
  const [parsedData, setParsedData] = useState<TimetableData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(true)
  const [isImagePanelOpen, setIsImagePanelOpen] = useState(true)
  const [configSelections, setConfigSelections] = useState<Record<string, string>>({})
  const [imagePanelWidth, setImagePanelWidth] = useState(320)
  const [showABSwap, setShowABSwap] = useState(false)
  const resizingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const parseJson = useCallback((text: string) => {
    setJsonText(text)
    if (!text.trim()) {
      setParsedData(null)
      setParseError(null)
      return
    }
    try {
      const parsed = JSON.parse(text) as TimetableData
      if (!parsed.subjects || !parsed.schedule || !parsed.slots || !parsed.config) {
        throw new Error("Invalid v2 timetable format. Must have subjects, config, slots, and schedule.")
      }
      setParsedData(parsed)
      setParseError(null)
      const selections: Record<string, string> = {}
      for (const [key, config] of Object.entries(parsed.config)) {
        selections[key] = config.values[0]?.id || ""
      }
      setConfigSelections(selections)
    } catch (e) {
      setParsedData(null)
      setParseError(e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : String(e))
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
            <TimetableRenderer
              data={parsedData}
              configSelections={configSelections}
              onConfigChange={handleConfigChange}
              error={parseError}
            />
          </div>
          {showABSwap && !isImagePanelOpen && (
            <div className="flex-1 min-h-0 overflow-auto p-4">
              <ImageUpload label="Reference Timetable" />
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
                  <ImageUpload label="Upload Timetable Image/PDF" />
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
  )
}

export default App
