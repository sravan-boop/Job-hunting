"""
Job Scraper — Indeed Job Search
Outputs strict JSON to stdout for n8n integration.

Usage:
    python3 scrape_indeed.py "AI Developer" "Bangalore"

Install:
    pip install seleniumbase
"""

import json
import sys
import urllib.parse
from seleniumbase import SB


def build_indeed_url(job_title, location):
    params = urllib.parse.urlencode({
        "q": job_title,
        "l": location,
    })
    return f"https://www.indeed.com/jobs?{params}"


def scrape_indeed(job_title, location, max_jobs=10):
    jobs = []
    url = build_indeed_url(job_title, location)

    try:
        with SB(uc=True, headless=True) as sb:
            sb.open(url)
            sb.sleep(3)

            # Scroll to load content
            for _ in range(3):
                sb.execute_script("window.scrollBy(0, 600);")
                sb.sleep(1)

            cards = sb.find_elements("css selector", ".job_seen_beacon, .resultContent")

            for card in cards[:max_jobs]:
                job = {}
                try:
                    title_el = card.find_element("css selector", "h2.jobTitle a, .jobTitle span")
                    job["title"] = title_el.text.strip()
                except Exception:
                    job["title"] = ""

                try:
                    company_el = card.find_element("css selector", "[data-testid='company-name'], .companyName")
                    job["company"] = company_el.text.strip()
                except Exception:
                    job["company"] = ""

                try:
                    location_el = card.find_element("css selector", "[data-testid='text-location'], .companyLocation")
                    job["location"] = location_el.text.strip()
                except Exception:
                    job["location"] = ""

                try:
                    link_el = card.find_element("css selector", "h2.jobTitle a, a.jcs-JobTitle")
                    href = link_el.get_attribute("href")
                    if href and not href.startswith("http"):
                        href = "https://www.indeed.com" + href
                    job["url"] = href
                except Exception:
                    job["url"] = ""

                try:
                    snippet_el = card.find_element("css selector", ".job-snippet, [data-testid='job-snippet']")
                    job["snippet"] = snippet_el.text.strip()
                except Exception:
                    job["snippet"] = ""

                job["source"] = "indeed"

                if job["title"]:
                    jobs.append(job)

    except Exception as e:
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python3 scrape_indeed.py <job_title> <location>"}))
        sys.exit(1)

    job_title = sys.argv[1]
    location = sys.argv[2]
    max_jobs = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    results = scrape_indeed(job_title, location, max_jobs)
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
