"""
Job Scraper API — FastAPI + Stealth Selenium
LinkedIn and Naukri job scraper with Docker support.

Run locally:
    uvicorn main:app --reload --port 8000

Test:
    curl "http://localhost:8000/scrape-jobs?title=AI+Developer&location=Bangalore"
"""

import asyncio
import os
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager, contextmanager
from enum import Enum

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MAX_CONCURRENT_BROWSERS = int(os.getenv("MAX_BROWSERS", "2"))
DEFAULT_MAX_RESULTS = 10
IS_DOCKER = os.path.exists("/.dockerenv") or os.getenv("DOCKER", "")

executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_BROWSERS)
browser_semaphore: asyncio.Semaphore


# ---------------------------------------------------------------------------
# Browser — two modes: Docker (raw selenium) vs Local (SeleniumBase UC)
# ---------------------------------------------------------------------------
@contextmanager
def get_browser():
    """
    Docker: uses raw selenium with the system-installed Chromium + chromedriver.
    Local:  uses SeleniumBase UC mode for stealth.
    """
    driver = None
    try:
        if IS_DOCKER:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service

            options = Options()
            options.binary_location = os.getenv("CHROME_BIN", "/usr/bin/chromium")
            options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_argument("--window-size=1920,1080")
            options.add_argument(
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            )

            service = Service(os.getenv("CHROMEDRIVER_PATH", "/usr/bin/chromedriver"))
            driver = webdriver.Chrome(service=service, options=options)
            yield driver
        else:
            from seleniumbase import SB
            with SB(uc=True, headless=True) as sb:
                yield sb.driver
    finally:
        if IS_DOCKER and driver:
            driver.quit()


import time


def _wait_and_scroll(driver, seconds=3, scrolls=3):
    time.sleep(seconds)
    for _ in range(scrolls):
        driver.execute_script("window.scrollBy(0, 800);")
        time.sleep(1)


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global browser_semaphore
    browser_semaphore = asyncio.Semaphore(MAX_CONCURRENT_BROWSERS)
    yield
    executor.shutdown(wait=False)


app = FastAPI(
    title="Job Scraper API",
    description="Stealth job scraper for LinkedIn and Naukri",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Platform(str, Enum):
    linkedin = "linkedin"
    naukri = "naukri"
    all = "all"


class JobListing(BaseModel):
    title: str
    company: str
    location: str
    url: str
    source: str
    posted: str = ""
    salary: str = ""
    experience: str = ""


class ScrapeResponse(BaseModel):
    query: dict
    total_found: int
    jobs: list[JobListing]


# ---------------------------------------------------------------------------
# LinkedIn scraper
# ---------------------------------------------------------------------------
def _scrape_linkedin(title: str, location: str, max_results: int) -> list[dict]:
    jobs = []
    params = urllib.parse.urlencode({"keywords": title, "location": location})
    url = f"https://www.linkedin.com/jobs/search/?{params}"

    try:
        with get_browser() as driver:
            driver.get(url)
            _wait_and_scroll(driver)

            cards = driver.find_elements("css selector", ".base-card")

            for card in cards[:max_results]:
                job = {"source": "linkedin", "salary": "", "experience": ""}

                try:
                    el = card.find_element("css selector", ".base-search-card__title")
                    job["title"] = el.text.strip()
                except Exception:
                    job["title"] = ""

                try:
                    el = card.find_element("css selector", ".base-search-card__subtitle")
                    job["company"] = el.text.strip()
                except Exception:
                    job["company"] = ""

                try:
                    el = card.find_element("css selector", ".job-search-card__location")
                    job["location"] = el.text.strip()
                except Exception:
                    job["location"] = ""

                try:
                    el = card.find_element("css selector", "a.base-card__full-link")
                    job["url"] = el.get_attribute("href").split("?")[0]
                except Exception:
                    job["url"] = ""

                try:
                    el = card.find_element("css selector", "time")
                    job["posted"] = el.get_attribute("datetime") or el.text.strip()
                except Exception:
                    job["posted"] = ""

                if job["title"]:
                    jobs.append(job)

    except Exception as e:
        print(f"[linkedin] Error: {e}", file=sys.stderr)

    return jobs


# ---------------------------------------------------------------------------
# Naukri scraper
# ---------------------------------------------------------------------------
def _scrape_naukri(title: str, location: str, max_results: int) -> list[dict]:
    jobs = []
    title_slug = title.lower().replace(" ", "-")
    location_slug = location.lower().replace(" ", "-")
    url = f"https://www.naukri.com/{title_slug}-jobs-in-{location_slug}"

    try:
        with get_browser() as driver:
            driver.get(url)
            _wait_and_scroll(driver)

            cards = driver.find_elements("css selector", ".srp-jobtuple-wrapper, .jobTuple")

            for card in cards[:max_results]:
                job = {"source": "naukri", "posted": ""}

                try:
                    el = card.find_element("css selector", ".title, a.title")
                    job["title"] = el.text.strip()
                    job["url"] = el.get_attribute("href") or ""
                except Exception:
                    job["title"] = ""
                    job["url"] = ""

                try:
                    el = card.find_element("css selector", ".comp-name, .subTitle a")
                    job["company"] = el.text.strip()
                except Exception:
                    job["company"] = ""

                try:
                    el = card.find_element("css selector", ".locWdth, .loc-wrap .loc")
                    job["location"] = el.text.strip()
                except Exception:
                    job["location"] = ""

                try:
                    el = card.find_element("css selector", ".exp-wrap .expwdth, .experience")
                    job["experience"] = el.text.strip()
                except Exception:
                    job["experience"] = ""

                try:
                    el = card.find_element("css selector", ".sal-wrap .salwdth, .salary")
                    job["salary"] = el.text.strip()
                except Exception:
                    job["salary"] = ""

                if job["title"]:
                    jobs.append(job)

    except Exception as e:
        print(f"[naukri] Error: {e}", file=sys.stderr)

    return jobs


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/scrape-jobs", response_model=ScrapeResponse)
async def scrape_jobs(
    title: str = Query(..., description="Job title", examples=["AI Developer"]),
    location: str = Query(..., description="Location", examples=["Bangalore"]),
    platform: Platform = Query(Platform.all, description="Platform to scrape"),
    max_results: int = Query(DEFAULT_MAX_RESULTS, ge=1, le=25),
):
    async with browser_semaphore:
        loop = asyncio.get_event_loop()
        all_jobs: list[dict] = []

        if platform in (Platform.all, Platform.linkedin):
            linkedin_jobs = await loop.run_in_executor(
                executor, _scrape_linkedin, title, location, max_results
            )
            all_jobs.extend(linkedin_jobs)

        if platform in (Platform.all, Platform.naukri):
            naukri_jobs = await loop.run_in_executor(
                executor, _scrape_naukri, title, location, max_results
            )
            all_jobs.extend(naukri_jobs)

    return ScrapeResponse(
        query={"title": title, "location": location, "platform": platform.value},
        total_found=len(all_jobs),
        jobs=all_jobs,
    )
