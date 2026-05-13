# AI Job Application Agent

An AI workflow automation project for job search operations. The app analyzes a job description, extracts role requirements, matches them against a candidate profile, generates tailored application content, and creates an application tracker row with E-Verify/STEM OPT follow-up fields.

This project is designed as a practical AI agent workflow rather than a model-training project. It breaks the process into agent-like steps: intake, requirement extraction, candidate matching, writing, risk review, and tracking.

## Demo

Run the local server and open the app in a browser.

The app supports two modes:

- OpenAI mode: calls the OpenAI Responses API through a local Node server
- Local fallback mode: uses deterministic matching if no API key is configured

## What It Does

- Parses job descriptions for skills, role type, location, seniority, visa language, and AI/automation keywords
- Scores candidate fit based on technical and workflow experience
- Generates tailored resume bullets for the role
- Generates a founder/recruiter outreach message
- Flags E-Verify, STEM OPT, sponsorship, and relocation follow-up questions
- Produces a CSV row for an application tracker

## Why This Project Matters

Many job applications are repetitive but still require judgment. This project shows how an AI-assisted workflow can turn unstructured job descriptions into structured actions while keeping a human in the loop for final review.

The workflow is relevant to roles such as:

- AI Operations Specialist
- AI Automation Specialist
- AI Implementation Specialist
- Customer Solutions Engineer
- Forward Deployed Engineer
- AI Workflow Builder
- LLM Application Engineer

## Architecture

```text
Job Description
      |
      v
Requirement Extractor
      |
      v
Candidate Matcher
      |
      v
Application Writer
      |
      v
E-Verify / OPT Risk Reviewer
      |
      v
Application Tracker Row
```

## Project Structure

```text
ai-job-application-agent/
  index.html
  styles.css
  src/
    app.js
    agent-core.mjs
  data/
    candidate_profile.json
    sample_jobs.json
  prompts/
    job_analysis_prompt.md
  docs/
    INTERVIEW_GUIDE.md
  tests/
    run-tests.mjs
```

## How To Run

Install/run requirements:

```bash
node --version
npm test
```

Start without an API key:

```bash
npm start
```

Then open:

```text
http://127.0.0.1:4173
```

Start with OpenAI API:

PowerShell:

```powershell
$env:OPENAI_API_KEY="sk-your-api-key"
$env:OPENAI_MODEL="gpt-4.1-mini"
npm start
```

macOS/Linux:

```bash
export OPENAI_API_KEY="sk-your-api-key"
export OPENAI_MODEL="gpt-4.1-mini"
npm start
```

Run tests:

```bash
node tests/run-tests.mjs
```

## API Design

The browser calls:

```text
POST /api/analyze
```

The local Node server holds the API key and calls the OpenAI Responses API. This keeps the key out of browser JavaScript.

If the key is missing or the API returns an error, the server returns local deterministic analysis as a fallback.

## Future Improvements

- Add OpenAI or Claude structured-output mode
- Save tracker rows to Google Sheets or Notion
- Add Gmail follow-up reminders
- Add resume PDF parsing
- Add LangGraph workflow orchestration
- Add RAG over past resume/project experience
- Deploy to GitHub Pages or Render

## Notes

This MVP intentionally keeps final decisions human-reviewed. It can draft application material and identify risks, but the user should confirm accuracy before submitting applications.
