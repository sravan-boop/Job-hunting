"""
Job Scraper API — FastAPI + SeleniumBase UC Mode
Stealth scraper for LinkedIn and Naukri job listings.

Run locally:
    uvicorn main:app --reload --port 8000

Test:
    curl "http://localhost:8000/scrape-jobs?title=AI+Developer&location=Bangalore"
    curl "http://localhost:8000/scrape-jobs?title=React+Engineer&location=Remote&platform=naukri&max_results=5"
"""

import asyncio
import json
import os
import sys
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from enum import Enum
from typing import Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from seleniumbase import SB

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MAX_CONCURRENT_BROWSERS = int(os.getenv("MAX_BROWSERS", "2"))
DEFAULT_MAX_RESULTS = 10
IS_DOCKER = os.path.exists("/.dockerenv") or os.getenv("DOCKER", "")

executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_BROWSERS)
browser_semaphore: asyncio.Semaphore

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
    description="Stealth job scraper using SeleniumBase UC mode",
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
# Browser helper
# ---------------------------------------------------------------------------
def _get_sb_kwargs():
    """SeleniumBase kwargs — adjusted for Docker vs local."""
    kwargs = {"uc": True, "headless": True}
    if IS_DOCKER:
        kwargs["chromium_arg"] = "--no-sandbox,--disable-dev-shm-usage,--disable-gpu"
    return kwargs

# ---------------------------------------------------------------------------
# LinkedIn scraper
# ---------------------------------------------------------------------------
def _scrape_linkedin(title: str, location: str, max_results: int) -> list[dict]:
    jobs = []
    params = urllib.parse.urlencode({"keywords": title, "location": location})
    url = f"https://www.linkedin.com/jobs/search/?{params}"

    try:
        with SB(**_get_sb_kwargs()) as sb:
            sb.open(url)
            sb.sleep(3)

            # Scroll to load more cards
            for _ in range(3):
                sb.execute_script("window.scrollBy(0, 800);")
                sb.sleep(1)

            cards = sb.find_elements("css selector", ".base-card")

            for card in cards[:max_results]:
                job = {"source": "linkedin"}

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

                job["salary"] = ""
                job["experience"] = ""

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
        with SB(**_get_sb_kwargs()) as sb:
            sb.open(url)
            sb.sleep(3)

            for _ in range(3):
                sb.execute_script("window.scrollBy(0, 600);")
                sb.sleep(1)

            cards = sb.find_elements("css selector", ".srp-jobtuple-wrapper, .jobTuple")

            for card in cards[:max_results]:
                job = {"source": "naukri"}

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

                job["posted"] = ""

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
    title: str = Query(..., description="Job title to search for", examples=["AI Developer"]),
    location: str = Query(..., description="Job location", examples=["Bangalore"]),
    platform: Platform = Query(Platform.all, description="Platform to scrape"),
    max_results: int = Query(DEFAULT_MAX_RESULTS, ge=1, le=25, description="Max results per platform"),
):
    """
    Scrape job listings from LinkedIn and/or Naukri.
    Returns structured JSON that n8n can consume directly.
    """
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
