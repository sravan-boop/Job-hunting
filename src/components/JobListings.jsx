import { useState } from 'react'
import { Briefcase, CheckSquare, ExternalLink } from 'lucide-react'
import JobCard from './JobCard'

export default function JobListings({ jobs }) {
  const [selected, setSelected] = useState(new Set())

  if (!jobs || jobs.length === 0) return null

  function toggleJob(job) {
    setSelected((prev) => {
      const next = new Set(prev)
      const key = job.job_apply_link || job.job_title
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function selectAll() {
    if (selected.size === jobs.length) {
      setSelected(new Set())
    } else {
      setSelected(
        new Set(jobs.map((j) => j.job_apply_link || j.job_title))
      )
    }
  }

  function applySelected() {
    const toApply = jobs.filter(
      (j) => selected.has(j.job_apply_link || j.job_title) && j.job_apply_link
    )
    toApply.forEach((job, i) => {
      setTimeout(() => {
        window.open(job.job_apply_link, '_blank')
      }, i * 500)
    })
  }

  const allSelected = selected.size === jobs.length

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-500" />
          Job Listings
          <span className="text-sm font-normal text-slate-400">
            ({jobs.length} found)
          </span>
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>

          {selected.size > 0 && (
            <button
              type="button"
              onClick={applySelected}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Apply to {selected.size} {selected.size === 1 ? 'Job' : 'Jobs'}
            </button>
          )}
        </div>
      </div>

      {/* Job cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job, idx) => (
          <JobCard
            key={job.job_apply_link || idx}
            job={job}
            selected={selected.has(job.job_apply_link || job.job_title)}
            onToggle={toggleJob}
          />
        ))}
      </div>
    </div>
  )
}
