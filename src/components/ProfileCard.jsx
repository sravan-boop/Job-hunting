import {
  User,
  Briefcase,
  Building2,
  Award,
  MapPin,
  GraduationCap,
  Clock,
} from 'lucide-react'

export default function ProfileCard({ profile }) {
  const {
    full_name,
    total_experience_years,
    current_title,
    current_company,
    highest_education,
    skills_primary,
    skills_secondary,
    domains_or_industries,
    current_location,
    availability_or_notice_period,
    summary,
  } = profile

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Avatar */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 shrink-0">
          <User className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Name + meta row */}
          <div>
            {full_name && (
              <h2 className="text-xl font-bold text-slate-900 truncate">
                {full_name}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
              {current_title && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {current_title}
                </span>
              )}
              {current_company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {current_company}
                </span>
              )}
              {total_experience_years != null && (
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {total_experience_years} yrs experience
                </span>
              )}
              {current_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {current_location}
                </span>
              )}
              {highest_education && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {highest_education}
                </span>
              )}
              {availability_or_notice_period && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {availability_or_notice_period}
                </span>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
          )}

          {/* Primary skills */}
          {skills_primary && skills_primary.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                Primary Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {skills_primary.map((skill) => (
                  <span
                    key={skill}
                    className="inline-block rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Secondary skills */}
          {skills_secondary && skills_secondary.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                Secondary Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {skills_secondary.map((skill) => (
                  <span
                    key={skill}
                    className="inline-block rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Domains */}
          {domains_or_industries && domains_or_industries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                Domains
              </p>
              <div className="flex flex-wrap gap-2">
                {domains_or_industries.map((domain) => (
                  <span
                    key={domain}
                    className="inline-block rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
