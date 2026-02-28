import { useState } from 'react'
import { Check, Copy, ExternalLink, Search } from 'lucide-react'

export default function PlatformCard({ platform, queries }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div
        className={`flex items-center gap-2.5 px-5 py-3.5 text-white ${platform.color}`}
      >
        <Search className="w-4 h-4" />
        <span className="font-semibold text-sm">{platform.name}</span>
        <span className="ml-auto text-xs opacity-80">
          {queries.length} {queries.length === 1 ? 'query' : 'queries'}
        </span>
      </div>

      {/* Queries list */}
      <div className="flex-1 divide-y divide-slate-100">
        {queries.map((q, idx) => (
          <QueryRow key={idx} query={q} />
        ))}
      </div>
    </div>
  )
}

function QueryRow({ query }) {
  const [copied, setCopied] = useState(false)
  const text = query.query_string || query.query || ''

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="px-5 py-3 flex items-start gap-3 group hover:bg-slate-50 transition-colors">
      <p className="flex-1 text-sm text-slate-700 break-words leading-relaxed">
        {text}
      </p>
      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <button
          onClick={handleCopy}
          title="Copy query"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
        {query.url && (
          <a
            href={query.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open search in new tab"
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </a>
        )}
      </div>
    </div>
  )
}
