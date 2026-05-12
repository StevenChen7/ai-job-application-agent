# Interview Guide

## 30-Second Project Pitch

I built an AI job application workflow that turns an unstructured job description into structured application actions. It extracts requirements, matches them to a candidate profile, generates tailored resume bullets and outreach messages, flags E-Verify/STEM OPT follow-up questions, and creates a tracker row for follow-up management.

## Why I Built It

I was applying to AI operations, implementation, and solutions roles. Each application required reading the job description, identifying the real requirements, tailoring my materials, and tracking E-Verify or STEM OPT risks. I built this project to automate the repetitive parts while keeping final decisions human-reviewed.

## Agent-Like Workflow

The project is organized like a simple agent:

1. Intake: collect company, role, location, source, and job description
2. Requirement extraction: identify skills, seniority, role type, and risk signals
3. Candidate matching: compare requirements with profile skills and projects
4. Writing: generate bullets and outreach message
5. Risk review: flag E-Verify, sponsorship, relocation, and I-983 follow-up
6. Tracker output: produce a CSV row for application tracking

## Tools Used

- HTML, CSS, JavaScript
- Modular JavaScript logic
- Heuristic NLP-style keyword matching
- CSV tracker output
- Prompt template for future LLM structured output

## How I Would Improve It

- Add OpenAI or Claude API with JSON schema structured outputs
- Add LangGraph to turn each step into a stateful workflow node
- Add RAG over my resume, projects, and prior applications
- Save tracker rows to Google Sheets or Notion
- Add Gmail follow-up reminders
- Add evaluation checks for hallucinated resume claims

## What This Shows

This project shows practical AI workflow thinking: breaking a messy business process into repeatable steps, using structured outputs, keeping humans in the loop, and turning analysis into action.
