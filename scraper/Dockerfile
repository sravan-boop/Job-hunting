FROM python:3.11-slim

# ---- Install Google Chrome ----
RUN apt-get update && apt-get install -y --no-install-recommends \
        wget gnupg2 ca-certificates fonts-liberation \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub \
       | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] \
       http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y --no-install-recommends \
        google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# ---- Env vars for headless Chrome in Docker ----
ENV DOCKER=1
ENV DISPLAY=:99

WORKDIR /app

# ---- Python deps ----
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- App code ----
COPY main.py .

EXPOSE 8000

# ---- Run ----
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
