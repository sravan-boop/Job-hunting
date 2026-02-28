"""
Job Scraper — LinkedIn Public Job Search
Outputs strict JSON to stdout for n8n integration.

Usage:
    python3 scrape_jobs.py "AI Developer" "Bangalore"
    python3 scrape_jobs.py "React Engineer" "Remote"

Install:
    pip install seleniumbase
"""

import json
import sys
import time
import urllib.parse
from seleniumbase import SB


def build_linkedin_url(job_title, location):
    params = urllib.parse.urlencode({
        "keywords": job_title,
        "location": location,
    })
    return f"https://www.linkedin.com/jobs/search/?{params}"


def scrape_linkedin(job_title, location, max_jobs=10):
    jobs = []
    url = build_linkedin_url(job_title, location)

    try:
        with SB(uc=True, headless=True) as sb:
            sb.open(url)
            # Wait for job cards to load
            sb.sleep(3)

            # Scroll down to load more listings
            for _ in range(3):
                sb.execute_script("window.scrollBy(0, 800);")
                sb.sleep(1)

            # LinkedIn public job search selectors
            cards = sb.find_elements("css selector", ".base-card")

            for card in cards[:max_jobs]:
                job = {}
                try:
                    title_el = card.find_element("css selector", ".base-search-card__title")
                    job["title"] = title_el.text.strip()
                except Exception:
                    job["title"] = ""

                try:
                    company_el = card.find_element("css selector", ".base-search-card__subtitle")
                    job["company"] = company_el.text.strip()
                except Exception:
                    job["company"] = ""

                try:
                    location_el = card.find_element("css selector", ".job-search-card__location")
                    job["location"] = location_el.text.strip()
                except Exception:
                    job["location"] = ""

                try:
                    link_el = card.find_element("css selector", "a.base-card__full-link")
                    job["url"] = link_el.get_attribute("href").split("?")[0]
                except Exception:
                    job["url"] = ""

                try:
                    time_el = card.find_element("css selector", "time")
                    job["posted"] = time_el.get_attribute("datetime") or time_el.text.strip()
                except Exception:
                    job["posted"] = ""

                job["source"] = "linkedin"

                # Only include if we got at least a title
                if job["title"]:
                    jobs.append(job)

    except Exception as e:
        # Log error to stderr, keep stdout clean for JSON
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python3 scrape_jobs.py <job_title> <location>"}))
        sys.exit(1)

    job_title = sys.argv[1]
    location = sys.argv[2]
    max_jobs = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    results = scrape_linkedin(job_title, location, max_jobs)

    # Strict JSON output — nothing else to stdout
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
