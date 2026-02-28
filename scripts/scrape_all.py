"""
Master Job Scraper — Runs all platform scrapers and combines results.
Outputs strict JSON to stdout for n8n integration.

Usage:
    python3 scrape_all.py "AI Developer" "Bangalore"
    python3 scrape_all.py "React Engineer" "Remote" 5

Output format:
{
  "query": { "title": "AI Developer", "location": "Bangalore" },
  "total_found": 25,
  "jobs": [
    {
      "title": "AI Developer",
      "company": "TCS",
      "location": "Bangalore",
      "url": "https://...",
      "source": "linkedin"
    },
    ...
  ]
}

Install:
    pip install seleniumbase
"""

import json
import sys
import concurrent.futures

from scrape_jobs import scrape_linkedin
from scrape_indeed import scrape_indeed
from scrape_naukri import scrape_naukri


def scrape_all_platforms(job_title, location, max_per_platform=10):
    all_jobs = []

    scrapers = [
        ("linkedin", scrape_linkedin),
        ("indeed", scrape_indeed),
        ("naukri", scrape_naukri),
    ]

    # Run scrapers in parallel for speed
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        future_to_platform = {}
        for name, func in scrapers:
            future = executor.submit(func, job_title, location, max_per_platform)
            future_to_platform[future] = name

        for future in concurrent.futures.as_completed(future_to_platform):
            platform = future_to_platform[future]
            try:
                results = future.result()
                all_jobs.extend(results)
                print(f"[{platform}] Found {len(results)} jobs", file=sys.stderr)
            except Exception as e:
                print(f"[{platform}] Failed: {e}", file=sys.stderr)

    return all_jobs


def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "Usage: python3 scrape_all.py <job_title> <location> [max_per_platform]"
        }))
        sys.exit(1)

    job_title = sys.argv[1]
    location = sys.argv[2]
    max_per_platform = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    jobs = scrape_all_platforms(job_title, location, max_per_platform)

    output = {
        "query": {
            "title": job_title,
            "location": location,
        },
        "total_found": len(jobs),
        "jobs": jobs,
    }

    # Strict JSON to stdout
    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
