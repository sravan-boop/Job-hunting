import { useState } from 'react'
import { Building2, MapPin, Clock, Banknote, ExternalLink, CheckCircle2 } from 'lucide-react'

export default function JobCard({ job, selected, onToggle }) {
  const {
    job_title,
    employer_name,
    job_city,
    job_state,
    job_country,
    job_apply_link,
    job_description,
    job_min_salary,
    job_max_salary,
    job_salary_currency,
    job_salary_period,
    job_employment_type,
    job_posted_at_datetime_utc,
    employer_logo,
  } = job

  const location = [job_city, job_state, job_country].filter(Boolean).join(', ')

  const salary =
    job_min_salary && job_max_salary
      ? `${job_salary_currency || '$'}${Math.round(job_min_salary / 1000)}k–${Math.round(job_max_salary / 1000)}k${job_salary_period ? `/${job_salary_period}` : ''}`
      : job_min_salary
        ? `${job_salary_currency || '$'}${Math.round(job_min_salary / 1000)}k+`
        : ''

  const posted = job_posted_at_datetime_utc
    ? new Date(job_posted_at_datetime_utc).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : ''

  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: logo + title + select */}
        <div className="flex items-start gap-3">
          {employer_logo ? (
            <img
              src={employer_logo}
              alt=""
              className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0"
              onError={(e) => (e.target.style.display = 'none')}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 leading-snug">
              {job_title}
            </h4>
            {employer_name && (
              <p className="text-sm text-slate-500 mt-0.5">{employer_name}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggle(job)}
            className={`shrink-0 p-1.5 rounded-lg border transition-colors ${
              selected
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'
            }`}
            title={selected ? 'Deselect' : 'Select for apply'}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs text-slate-500">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1">
              <Banknote className="w-3 h-3" />
              {salary}
            </span>
          )}
          {job_employment_type && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {job_employment_type.replace('_', ' ')}
            </span>
          )}
          {posted && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {posted}
            </span>
          )}
        </div>

        {/* Description preview */}
        {job_description && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {job_description.replace(/<[^>]*>/g, '').slice(0, 200)}...
            </p>
            {job_description.length > 200 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-indigo-600 font-medium mt-1 hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
            {expanded && (
              <p className="text-xs text-slate-500 leading-relaxed mt-2 whitespace-pre-line">
                {job_description.replace(/<[^>]*>/g, '')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Apply button */}
      {job_apply_link && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
          <a
            href={job_apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Apply on {job.employer_name || 'company site'}
          </a>
        </div>
      )}
    </div>
  )
}
