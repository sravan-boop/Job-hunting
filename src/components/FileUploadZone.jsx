import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, X } from 'lucide-react'

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return 'Please upload a PDF or DOCX file.'
  }
  if (file.size > MAX_SIZE) {
    return 'File is too large. Maximum size is 5 MB.'
  }
  return null
}

export default function FileUploadZone({ onTextExtracted, onError, analyzing }) {
  const [file, setFile] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)
  const busy = extracting || analyzing

  async function processFile(selectedFile) {
    const error = validateFile(selectedFile)
    if (error) {
      onError(error)
      return
    }

    onError(null)
    setFile(selectedFile)
    setExtracting(true)

    try {
      let text = ''
      const ext = selectedFile.name.split('.').pop().toLowerCase()

      if (ext === 'pdf') {
        const { extractTextFromPdf } = await import('../lib/pdfParser.js')
        text = await extractTextFromPdf(selectedFile)
      } else {
        const { extractTextFromDocx } = await import('../lib/docxParser.js')
        text = await extractTextFromDocx(selectedFile)
      }

      if (!text.trim()) {
        setFile(null)
        setExtracting(false)
        onError(
          'File appears empty or contains no extractable text. If this is a scanned PDF, please copy the text into a .docx file instead.'
        )
        return
      }

      onTextExtracted(text)
    } catch {
      setFile(null)
      onError(
        'Failed to extract text from the file. The file may be corrupted or password-protected.'
      )
    } finally {
      setExtracting(false)
    }
  }

  function handleRemove() {
    setFile(null)
    onError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (busy) return
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) processFile(dropped)
  }

  function handleDragOver(e) {
    e.preventDefault()
    if (!busy) setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleChange(e) {
    const selected = e.target.files?.[0]
    if (selected) processFile(selected)
  }

  // Analyzing state — API call in progress
  if (analyzing && file) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-10">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            Analyzing your resume...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Building tailored search queries across platforms
          </p>
        </div>
      </div>
    )
  }

  // Extracting state — reading file contents
  if (extracting) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-10">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-600">
          Extracting text from{' '}
          <span className="font-medium">{file?.name}</span>...
        </p>
      </div>
    )
  }

  // Loaded state — file processed, API not yet started or previously failed
  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">
            {file.name}
          </p>
          <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Default drop zone
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-12 cursor-pointer transition-colors ${
        dragOver
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
      }`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100">
        <Upload className="w-6 h-6 text-indigo-500" />
      </div>
      <div className="text-center">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-indigo-600">Drag & drop</span> your
          resume here, or{' '}
          <span className="font-semibold text-indigo-600">browse</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF or DOCX, up to 5 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
