# AI Agent Toolkit Learning Map

This is the practical learning path for AI Agent Engineer, AI Automation Specialist, AI Operations Specialist, and AI Implementation roles.

## 1. Prompt Engineering

What to know:
- Clear task instructions
- Role/context separation
- Examples and output constraints
- Human review checkpoints

How this project uses it:
- `prompts/job_analysis_prompt.md` defines a structured job-analysis prompt.
- The app generates tailored outreach and resume bullets from role context.

Interview explanation:
- "I use prompts to turn unstructured job descriptions into structured outputs that can be reviewed before use."

## 2. Structured Outputs

What to know:
- JSON output
- Schema validation
- Required fields
- Failure handling when the model returns invalid data

How this project uses it:
- The current MVP uses deterministic JavaScript objects.
- The prompt file is ready to be upgraded to JSON schema output from an LLM.

Interview explanation:
- "For production AI workflows, I prefer structured outputs because they are easier to validate, test, and pass to downstream tools."

## 3. Tool Calling

What to know:
- Letting an LLM call approved tools
- Separating reasoning from actions
- Confirming before risky actions

Possible tools for this project:
- Save row to Google Sheets
- Create Notion tracker entry
- Draft Gmail follow-up
- Search E-Verify employer database

Interview explanation:
- "The agent should not just generate text. It should call tools safely, log actions, and keep a human in the loop."

## 4. RAG

What to know:
- Embeddings
- Chunking
- Vector search
- Retrieval quality
- Citations and source grounding

Future upgrade:
- Store resume, projects, and past applications as documents.
- Retrieve the most relevant experience before generating tailored bullets.

Interview explanation:
- "RAG would let the agent ground resume tailoring in actual candidate experience instead of inventing claims."

## 5. LangChain and LangGraph

What to know:
- LangChain helps connect LLMs, prompts, tools, retrievers, and memory.
- LangGraph is better for stateful multi-step workflows.

Future upgrade:
- Node 1: Parse JD
- Node 2: Match candidate profile
- Node 3: Generate materials
- Node 4: Review OPT/E-Verify risk
- Node 5: Save tracker row

Interview explanation:
- "I would use LangGraph when the workflow has multiple steps, state, branching, retries, and human review."

## 6. Vector Databases

What to know:
- Chroma: easy local demo
- Qdrant: good open-source service
- Pinecone: managed cloud vector database
- pgvector: vector search inside Postgres

Future upgrade:
- Use Chroma for local resume/project retrieval.
- Use pgvector if the app grows into a production-style database project.

## 7. Automation Tools

What to know:
- n8n, Zapier, Make
- Webhooks
- API keys
- JSON data mapping

Future upgrade:
- Trigger the workflow when a new job URL is added.
- Save results to Google Sheets.
- Send a follow-up reminder three days later.

## 8. Evaluation

What to know:
- Accuracy checks
- Hallucination checks
- Missing requirement checks
- Tone review
- Human approval before submission

How this project uses it:
- The app flags missing skills and OPT risk.
- Human review is required before submitting messages.

Interview explanation:
- "I think evaluation is essential because AI workflow tools can create confident but inaccurate application material."

## 9. Deployment

Good options:
- GitHub Pages for static app
- Render for backend apps
- Streamlit Cloud for Python demos
- Vercel for frontend apps

Recommended first deployment:
- GitHub Pages, because this project is static.

## 10. What To Learn Next

One-week sprint:
- Day 1: Prompt engineering and structured outputs
- Day 2: Tool calling basics
- Day 3: RAG with Chroma
- Day 4: LangGraph workflow nodes
- Day 5: n8n or Zapier workflow
- Day 6: Evaluation checklist
- Day 7: Deploy and record demo
