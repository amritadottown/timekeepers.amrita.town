import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Upload } from "lucide-react"

interface JsonEditorProps {
  json: string
  onChange: (value: string) => void
  onFileUpload: (file: File) => void
  isOpen: boolean
  onToggle: () => void
}

export function JsonEditor({ json, onChange, onFileUpload, isOpen, onToggle }: JsonEditorProps) {
  return (
    <div
      className={`border-r border-border bg-background transition-all duration-300 flex flex-col ${
        isOpen ? "w-[400px] min-w-[400px]" : "w-10 min-w-10"
      }`}
    >
      <div className="flex items-center gap-2 p-2 border-b border-border">
        {isOpen && (
          <>
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">JSON Editor</span>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto size-8"
          onClick={onToggle}
        >
          {isOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      </div>
      {isOpen && (
        <div className="flex-1 flex flex-col gap-2 p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.accept = ".json,application/json"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) onFileUpload(file)
                }
                input.click()
              }}
            >
              <Upload className="size-3 mr-1" />
              Load JSON
            </Button>
          </div>
          <Textarea
            value={json}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your v2 timetable JSON here..."
            className="flex-1 font-mono text-xs resize-none"
          />
        </div>
      )}
    </div>
  )
}
