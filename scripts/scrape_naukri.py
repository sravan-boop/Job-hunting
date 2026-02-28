"""
Job Scraper — Naukri.com Job Search
Outputs strict JSON to stdout for n8n integration.

Usage:
    python3 scrape_naukri.py "AI Developer" "Bangalore"

Install:
    pip install seleniumbase
"""

import json
import sys
import urllib.parse
from seleniumbase import SB


def build_naukri_url(job_title, location):
    # Naukri uses dash-separated keywords in URL
    title_slug = job_title.lower().replace(" ", "-")
    location_slug = location.lower().replace(" ", "-")
    return f"https://www.naukri.com/{title_slug}-jobs-in-{location_slug}"


def scrape_naukri(job_title, location, max_jobs=10):
    jobs = []
    url = build_naukri_url(job_title, location)

    try:
        with SB(uc=True, headless=True) as sb:
            sb.open(url)
            sb.sleep(3)

            for _ in range(3):
                sb.execute_script("window.scrollBy(0, 600);")
                sb.sleep(1)

            cards = sb.find_elements("css selector", ".srp-jobtuple-wrapper, .jobTuple")

            for card in cards[:max_jobs]:
                job = {}
                try:
                    title_el = card.find_element("css selector", ".title, a.title")
                    job["title"] = title_el.text.strip()
                    job["url"] = title_el.get_attribute("href") or ""
                except Exception:
                    job["title"] = ""
                    job["url"] = ""

                try:
                    company_el = card.find_element("css selector", ".comp-name, .subTitle a")
                    job["company"] = company_el.text.strip()
                except Exception:
                    job["company"] = ""

                try:
                    location_el = card.find_element("css selector", ".locWdth, .loc-wrap .loc")
                    job["location"] = location_el.text.strip()
                except Exception:
                    job["location"] = ""

                try:
                    exp_el = card.find_element("css selector", ".exp-wrap .expwdth, .experience")
                    job["experience"] = exp_el.text.strip()
                except Exception:
                    job["experience"] = ""

                try:
                    salary_el = card.find_element("css selector", ".sal-wrap .salwdth, .salary")
                    job["salary"] = salary_el.text.strip()
                except Exception:
                    job["salary"] = ""

                job["source"] = "naukri"

                if job["title"]:
                    jobs.append(job)

    except Exception as e:
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python3 scrape_naukri.py <job_title> <location>"}))
        sys.exit(1)

    job_title = sys.argv[1]
    location = sys.argv[2]
    max_jobs = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    results = scrape_naukri(job_title, location, max_jobs)
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
