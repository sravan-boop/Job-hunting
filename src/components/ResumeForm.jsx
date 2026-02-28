import { useState } from 'react'
import { AlertCircle, FileText } from 'lucide-react'
import FileUploadZone from './FileUploadZone'

export default function ResumeForm({ onSubmit, loading }) {
  const [uploadError, setUploadError] = useState(null)

  function handleTextExtracted(text) {
    if (text.trim()) {
      onSubmit(text)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center space-y-2 mb-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Find Your Next Opportunity
        </h2>
        <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
          Upload your resume and we'll generate tailored job search queries
          for LinkedIn, Naukri, Indeed, and Glassdoor.
        </p>
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-5 pb-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-700">
            Upload Resume
          </span>
        </div>
        <div className="px-5 pb-5 space-y-3">
          <FileUploadZone
            onTextExtracted={handleTextExtracted}
            onError={(msg) => setUploadError(msg)}
            analyzing={loading}
          />
          {uploadError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
