import { ArrowLeft } from 'lucide-react'
import ProfileCard from './ProfileCard'
import PlatformCard from './PlatformCard'

const PLATFORM_META = {
  linkedin: { name: 'LinkedIn', color: 'bg-sky-600', accent: 'border-sky-500' },
  naukri: { name: 'Naukri', color: 'bg-emerald-600', accent: 'border-emerald-500' },
  indeed: { name: 'Indeed', color: 'bg-blue-700', accent: 'border-blue-600' },
  glassdoor: { name: 'Glassdoor', color: 'bg-green-600', accent: 'border-green-500' },
}

export default function ResultsDashboard({ data, onReset }) {
  const { candidate_profile, platform_queries } = data

  const platforms = platform_queries
    ? Object.entries(platform_queries).filter(
        ([, queries]) => Array.isArray(queries) && queries.length > 0
      )
    : []

  return (
    <div className="space-y-6 animate-in">
      {/* Back button */}
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        New Search
      </button>

      {/* Profile summary card */}
      {candidate_profile && <ProfileCard profile={candidate_profile} />}

      {/* Platform queries grid */}
      {platforms.length > 0 ? (
        <>
          <h3 className="text-lg font-bold text-slate-800">
            Search Queries by Platform
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {platforms.map(([key, queries]) => (
              <PlatformCard
                key={key}
                platform={PLATFORM_META[key] || { name: key, color: 'bg-slate-600', accent: 'border-slate-500' }}
                queries={queries}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No search queries were generated. Try providing more details in your resume.
        </div>
      )}
    </div>
  )
}
