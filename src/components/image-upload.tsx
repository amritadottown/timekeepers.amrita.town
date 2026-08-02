import { useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X } from "lucide-react"

interface ImageUploadProps {
  label?: string
  file: File | null
  onFileChange: (file: File | null) => void
}

export function ImageUpload({
  label = "Upload Timetable Image/PDF",
  file,
  onFileChange,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onFileChange(f)
    e.target.value = ""
  }

  const clear = () => {
    onFileChange(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{label}</h3>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="timetable-upload"
        />
        {!file ? (
          <label
            htmlFor="timetable-upload"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 cursor-pointer transition-colors"
          >
            <Upload className="size-3" />
            Choose File
          </label>
        ) : (
          <Button variant="ghost" size="sm" onClick={clear}>
            <X className="size-3 mr-1" />
            Remove
          </Button>
        )}
      </div>
      {file && (
        <p className="text-xs text-muted-foreground mb-2 truncate">{file.name}</p>
      )}
      {file && file.type.startsWith("image/") && objectUrl && (
        <div className="relative border rounded overflow-hidden">
          <img
            src={objectUrl}
            alt="Timetable reference"
            className="w-full h-auto max-h-[500px] object-contain"
          />
        </div>
      )}
      {file && file.type === "application/pdf" && objectUrl && (
        <object
          data={objectUrl}
          type="application/pdf"
          className="w-full h-[500px] border rounded"
        >
          <p className="text-sm text-muted-foreground p-4">
            PDF preview not available.{" "}
            <a href={objectUrl} target="_blank" className="underline">
              Open file
            </a>
          </p>
        </object>
      )}
    </Card>
  )
}
