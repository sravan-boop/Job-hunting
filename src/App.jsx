import { useState } from 'react'
import { BriefcaseBusiness, Sparkles } from 'lucide-react'
import ResumeForm from './components/ResumeForm'
import ResultsDashboard from './components/ResultsDashboard'
import ErrorBanner from './components/ErrorBanner'

const API_URL = 'https://clientworks.app.n8n.cloud/webhook-test/job-search-assistant'

export default function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(resumeText) {
    setLoading(true)
    setError(null)
    setResults(null)

    const payload = {
      resume_text: resumeText.trim(),
      user_preferences: {
        target_roles: [],
        target_locations: [],
        remote_preference: '',
        job_type: '',
        experience_level: '',
      },
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(
          res.status === 500
            ? 'The server encountered an error. Please try again in a moment.'
            : `Request failed with status ${res.status}. Please try again.`
        )
      }

      const data = await res.json()

      if (!data || (!data.candidate_profile && !data.job_listings)) {
        throw new Error('Received an unexpected response format. Please try again.')
      }

      setResults(data)
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error — please check your internet connection and try again.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResults(null)
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shrink-0">
            <BriefcaseBusiness className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              AI Job Search Assistant
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Upload your resume and get tailored job search queries across top platforms
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {!results ? (
          <ResumeForm onSubmit={handleSubmit} loading={loading} />
        ) : (
          <ResultsDashboard data={results} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        AI Job Search Assistant &mdash; Your data is processed securely and never stored.
      </footer>
    </div>
  )
}
