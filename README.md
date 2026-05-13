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
- Lets users edit a candidate profile with name, headline, skills, experience, and work authorization notes
- Fetches job pages from a URL when the page allows automated reading
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
Candidate Profile
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

## Candidate Profile

The UI includes an editable candidate profile panel:

- Name
- Headline
- Skills
- Experience / projects
- Work authorization notes

The default profile is prefilled for Zhuo Chen, but the app can analyze any candidate profile entered by the user.

## Job URL Fetching

The UI includes a `Job URL` field and `Fetch` button.

When a URL is provided, the browser calls:

```text
POST /api/fetch-job
```

The local Node server attempts to fetch the job page, convert HTML to readable text, infer company/role/location/source, and populate the form.

If direct HTML fetching fails, the app tries a reader fallback using `https://r.jina.ai/` to convert the URL into LLM-friendly text.

Some job boards require login, client-side JavaScript rendering, or block automated access. In those cases, the app shows an error and the user can still paste the job description manually.

## Chrome Extension Import

For pages that cannot be fetched by URL, use the included Chrome extension:

```text
chrome-extension/
  manifest.json
  popup.html
  popup.js
```

Install locally:

1. Open `chrome://extensions`
2. Turn on Developer mode
3. Click `Load unpacked`
4. Select the `chrome-extension` folder
5. Start the local app server
6. Open a job page in Chrome
7. Click the extension and import the current page
8. Return to the app and click `Use Imported Page`

The extension reads the currently rendered page text from the active tab. If the user selects text first, only the selected text is imported.

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
