from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

app = FastAPI()


# CORS for React + Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://repo-pulse-lite.vercel.app",
        "http://localhost:5173",
        "http://localhost:5176"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RepoRequest(BaseModel):
    repo_url: str


@app.get("/")
def home():
    return {"message": "RepoPulse Lite Backend Running Successfully!"}


# ---------------- AI INSIGHT ----------------
def generate_insight(stars, forks, language, health):
    if health >= 80:
        status = "Excellent ✅"
    elif health >= 60:
        status = "Good 👍"
    else:
        status = "Needs Improvement ⚠️"

    return f"""
🤖 AI Repository Insights

This repository is mainly developed using {language}.

It has {stars} stars and {forks} forks,
which shows strong open source community support.

Repository Health Status:
{status}

Community Activity:
High developer engagement based on stars, forks and contributors.

The project appears to be actively maintained and has good popularity.
"""


# ---------------- README ANALYSIS ----------------
def analyze_readme(owner, repo):
    url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        return {
            "exists": True,
            "size": data["size"],
            "message": "README file available ✅"
        }

    return {
        "exists": False,
        "size": 0,
        "message": "README file not found ⚠️"
    }


# ---------------- LICENSE ----------------
def get_license(data):
    if data.get("license"):
        return data["license"]["name"]
    return "No License"


# ---------------- TOPICS ----------------
def get_topics(owner, repo):
    url = f"https://api.github.com/repos/{owner}/{repo}/topics"
    headers = {
        "Accept": "application/vnd.github.mercy-preview+json"
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json().get("names", [])
    return []


# ---------------- LATEST COMMIT ----------------
def get_latest_commit(owner, repo):
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    response = requests.get(url)

    if response.status_code == 200:
        commits = response.json()
        if commits:
            return {
                "message": commits[0]["commit"]["message"],
                "author": commits[0]["commit"]["author"]["name"]
            }

    return {
        "message": "No commit found",
        "author": "Unknown"
    }


# ---------------- COMMIT ANALYSIS ----------------
def get_commit_analysis(owner, repo):
    url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=20"
    response = requests.get(url)

    commits = []
    tier1 = 0
    tier2 = 0
    tier3 = 0

    if response.status_code == 200:
        for commit in response.json():
            sha = commit["sha"]
            detail_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
            detail = requests.get(detail_url)
            if detail.status_code != 200:
                continue

            info = detail.json()
            files_changed = len(info.get("files", []))
            lines_changed = info.get("stats", {}).get("total", 0)

            if lines_changed < 50:
                tier = "Tier 1"
                tier1 += 1
            elif lines_changed <= 250 and files_changed < 5:
                tier = "Tier 2"
                tier2 += 1
            else:
                tier = "Tier 3"
                tier3 += 1

            commits.append({
                "author": info["commit"]["author"]["name"],
                "message": info["commit"]["message"],
                "files_changed": files_changed,
                "lines_changed": lines_changed,
                "tier": tier
            })

    return {
        "commits": commits,
        "tier_breakdown": {
            "tier1": tier1,
            "tier2": tier2,
            "tier3": tier3
        }
    }


# ---------------- ANALYZE API ----------------
@app.post("/analyze")
def analyze_repo(request: RepoRequest):
    try:
        repo_url = request.repo_url.strip().rstrip("/")

        if "github.com" not in repo_url:
            raise HTTPException(status_code=400, detail="Please enter valid GitHub URL")

        parts = repo_url.split("/")

        try:
            owner = parts[3]
            repo = parts[4]

            if repo.endswith(".git"):
                repo = repo.replace(".git", "")

        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Please enter valid GitHub URL"
            )

            api = f"https://api.github.com/repos/{owner}/{repo}"

        print("========== DEBUG ==========")
        print("Repo URL:", repo_url)
        print("Owner:", owner)
        print("Repo:", repo)
        print("API:", api)

        response = requests.get(
            api,
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "RepoPulseLite"
            },
            timeout=20
        )

        print("Status:", response.status_code)
        print("Response:", response.text)
        print("===========================")

        if response.status_code != 200:
            raise HTTPException(
                status_code=404,
                detail=response.text
            )

        data = response.json()

        stars = data["stargazers_count"]
        forks = data["forks_count"]
        issues = data["open_issues_count"]

        score = 50
        if stars > 1000:
            score += 20
        elif stars > 100:
            score += 10

        if forks > 500:
            score += 15
        elif forks > 50:
            score += 8

        if issues < 100:
            score += 15
        elif issues < 500:
            score += 5

        score = min(score, 100)

        # ---------------- CONTRIBUTORS ----------------
        contributors = []
        con_url = f"https://api.github.com/repos/{owner}/{repo}/contributors"
        con_response = requests.get(con_url)

        if con_response.status_code == 200:
            for user in con_response.json()[:5]:
                contributors.append({
                    "username": user["login"],
                    "contributions": user["contributions"],
                    "profile": user["html_url"]
                })

        # ---------------- LANGUAGES ----------------
        lang_url = f"https://api.github.com/repos/{owner}/{repo}/languages"
        lang_response = requests.get(lang_url)

        languages = {}
        if lang_response.status_code == 200:
            languages = lang_response.json()

        # ---------------- EXTRA FEATURES ----------------
        readme = analyze_readme(owner, repo)
        license = get_license(data)
        topics = get_topics(owner, repo)
        latest_commit = get_latest_commit(owner, repo)
        commit_analysis = get_commit_analysis(owner, repo)

        ai_insight = generate_insight(
            stars,
            forks,
            data["language"],
            score
        )

        return {
            "name": data["name"],
            "description": data["description"],
            "stars": stars,
            "forks": forks,
            "language": data["language"],
            "open_issues": issues,
            "owner": data["owner"]["login"],
            "health_score": score,
            "created_date": data["created_at"],
            "updated_date": data["updated_at"],
            "size": data["size"],
            "default_branch": data["default_branch"],
            "contributors": contributors,
            "languages": languages,
            "readme": readme,
            "license": license,
            "topics": topics,
            "latest_commit": latest_commit,
            "ai_insight": ai_insight,
            "commit_analysis": commit_analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- PDF REPORT GENERATION ----------------
@app.post("/generate-report")
def generate_report(data: dict):
    filename = "RepoPulse_Report.pdf"
    pdf = canvas.Canvas(filename, pagesize=letter)
    y = 750

    def write_line(text):
        nonlocal y
        if y < 50:
            pdf.showPage()
            y = 750
        pdf.drawString(50, y, str(text)[:110])
        y -= 20

    pdf.setFont("Helvetica-Bold", 18)
    write_line("RepoPulse Lite Report")

    pdf.setFont("Helvetica", 11)
    write_line(f"Name: {data.get('name')}")
    write_line(f"Description: {data.get('description')}")
    write_line(f"Stars: {data.get('stars')}")
    write_line(f"Forks: {data.get('forks')}")
    write_line(f"Language: {data.get('language')}")
    write_line(f"Owner: {data.get('owner')}")
    write_line(f"License: {data.get('license')}")
    write_line(f"Health Score: {data.get('health_score')}/100")
    write_line(f"Branch: {data.get('default_branch')}")

    y -= 10
    write_line("Top Contributors")
    for user in data.get("contributors", []):
        write_line(f"{user['username']} - {user['contributions']} contributions")

    y -= 10
    write_line("Languages")
    for lang, value in data.get("languages", {}).items():
        write_line(f"{lang}: {value} bytes")

    y -= 10
    write_line("Topics")
    for topic in data.get("topics", []):
        write_line(topic)

    y -= 10
    write_line("Latest Commit")
    commit = data.get("latest_commit", {})
    write_line(f"Author: {commit.get('author')}")
    write_line(f"Message: {commit.get('message')}")

    y -= 10
    write_line("AI Insights")
    for line in data.get("ai_insight", "").split("\n"):
        write_line(line)

    pdf.save()

    return FileResponse(filename, media_type="application/pdf", filename=filename)
 