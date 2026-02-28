import { ArrowLeft } from 'lucide-react'
import ProfileCard from './ProfileCard'
import JobListings from './JobListings'

export default function ResultsDashboard({ data, onReset }) {
  const { candidate_profile, job_listings } = data

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

      {/* Job listings */}
      {job_listings && job_listings.length > 0 ? (
        <JobListings jobs={job_listings} />
      ) : (
        <div className="text-center py-12 text-slate-400">
          No job listings were found. Try uploading a more detailed resume.
        </div>
      )}
    </div>
  )
}
