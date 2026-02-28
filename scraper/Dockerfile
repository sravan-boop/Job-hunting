FROM python:3.11-slim

# ---- Install ARM64-native Chromium + driver ----
RUN apt-get update && apt-get install -y --no-install-recommends \
        chromium chromium-driver \
        fonts-liberation fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# ---- Tell SeleniumBase to NOT download its own chromedriver ----
ENV DOCKER=1
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver
ENV SE_AVOID_STATS=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
