import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateApplicationContent } from "./src/agent-core.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
let latestImportedPage = null;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    setCorsHeaders(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/api/analyze") {
      const body = await readJson(req);
      const result = await analyzeWithOpenAI(body);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === "POST" && req.url === "/api/import-page") {
      const body = await readJson(req);
      const result = importRenderedPage(body);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === "GET" && req.url === "/api/imported-page") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(latestImportedPage || { ok: false, error: "No imported page yet." }));
      return;
    }

    if (req.method === "POST" && req.url === "/api/fetch-job") {
      const body = await readJson(req);
      const result = await fetchJobFromUrl(body.url);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    }

    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const requestPath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(root, safePath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const content = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI Job Application Agent running at http://127.0.0.1:${port}`);
});

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function importRenderedPage(payload = {}) {
  const url = payload.url || "";
  const title = payload.title || "";
  const text = String(payload.selectedText || payload.text || "").trim();
  if (!text || text.length < 80) {
    return { ok: false, error: "Current page text is too short. Select the job description text and try again." };
  }

  const parsed = parseJobMetadata(title, text, url || "https://current-tab.local");
  latestImportedPage = {
    ok: true,
    importedAt: new Date().toISOString(),
    url,
    title,
    fetchMode: payload.selectedText ? "chrome-extension-selection" : "chrome-extension-dom",
    ...parsed,
    jobDescription: text.slice(0, 16000)
  };
  return latestImportedPage;
}

async function fetchJobFromUrl(jobUrl) {
  if (!jobUrl || !/^https?:\/\//i.test(jobUrl)) {
    return { ok: false, error: "Please provide a valid http or https job URL." };
  }

  try {
    const response = await fetch(jobUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 AI Job Application Agent",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    const html = await response.text();
    if (!response.ok) {
      return { ok: false, error: `Could not fetch page: HTTP ${response.status}` };
    }

    let text = htmlToText(html);
    let title = extractTitle(html);
    let fetchMode = "direct-html";

    if (isUnreadableJobText(text)) {
      const reader = await fetchWithReader(jobUrl);
      if (reader.ok) {
        text = reader.text;
        title = reader.title || title;
        fetchMode = "jina-reader";
      }
    }

    if (isUnreadableJobText(text)) {
      return {
        ok: false,
        error: "The page could not be read cleanly. It may require login, JavaScript rendering, or block automated access."
      };
    }

    const parsed = parseJobMetadata(title, text, jobUrl);
    return {
      ok: true,
      url: jobUrl,
      fetchMode,
      ...parsed,
      jobDescription: text.slice(0, 12000)
    };
  } catch (error) {
    return { ok: false, error: `Fetch failed: ${error.message}` };
  }
}

function isUnreadableJobText(text) {
  return !text || text.length < 300 || /sign in|log in|enable javascript|access denied/i.test(text.slice(0, 1200));
}

async function fetchWithReader(jobUrl) {
  try {
    const readerUrl = `https://r.jina.ai/${jobUrl}`;
    const response = await fetch(readerUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 AI Job Application Agent",
        "Accept": "text/plain,text/markdown"
      }
    });
    const text = await response.text();
    if (!response.ok || text.length < 300) return { ok: false };
    const title = text.match(/^Title:\s*(.+)$/m)?.[1] || "";
    return { ok: true, text, title };
  } catch {
    return { ok: false };
  }
}

function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|section|article|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTitle(html) {
  const title = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  return htmlToText(title);
}

function parseJobMetadata(title, text, jobUrl) {
  const firstLines = text.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 20);
  const combined = [title, ...firstLines].join("\n");
  const atMatch = combined.match(/(.+?)\s+(?:at|@)\s+(.+?)(?:\s+-|\s+\||$)/i);
  const role = cleanField(atMatch?.[1]) || cleanField(firstLines.find((line) => /engineer|analyst|specialist|coordinator|manager|developer|designer/i.test(line))) || "";
  const company = cleanField(atMatch?.[2]) || cleanField(firstLines.find((line) => /^[A-Z][A-Za-z0-9 .&-]{2,40}$/.test(line))) || "";
  const location = text.match(/\b(San Francisco|New York|Boston|Houston|Remote|Redwood City|Los Angeles|California|NYC|Bay Area)[^.\n,]*/i)?.[0] || "";
  const source = new URL(jobUrl).hostname.replace(/^www\./, "");
  return { company, role, location, source };
}

function cleanField(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/\b(Y Combinator|Work at a Startup|Jobs|Careers)\b/gi, "")
    .replace(/[-|]+$/g, "")
    .trim();
}

async function analyzeWithOpenAI(input) {
  const fallback = generateApplicationContent(input);
  if (!process.env.OPENAI_API_KEY) {
    return {
      mode: "local-fallback",
      warning: "OPENAI_API_KEY is not set. Using local deterministic analysis.",
      ...fallback
    };
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      fitScore: { type: "integer", minimum: 0, maximum: 100 },
      fitLevel: { type: "string", enum: ["Strong", "Moderate", "Stretch"] },
      roleType: { type: "string" },
      optRisk: { type: "string", enum: ["Low", "Medium", "High", "Need confirm"] },
      summary: { type: "string" },
      tailoredBullets: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      outreachMessage: { type: "string" },
      trackerNotes: { type: "string" },
      missingSkills: { type: "array", items: { type: "string" } },
      recruiterQuestions: { type: "array", items: { type: "string" } }
    },
    required: [
      "fitScore",
      "fitLevel",
      "roleType",
      "optRisk",
      "summary",
      "tailoredBullets",
      "outreachMessage",
      "trackerNotes",
      "missingSkills",
      "recruiterQuestions"
    ]
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are an AI job application workflow assistant.",
            "Analyze job descriptions and generate truthful, human-reviewed application materials.",
            "Do not invent experience. Use only the candidate profile provided.",
            "Flag E-Verify, STEM OPT, sponsorship, relocation, and missing-skill risks separately.",
            "Keep writing concise, natural, and startup-friendly."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            candidateProfile: input.candidateProfile,
            job: input
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "job_application_analysis",
          schema,
          strict: true
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      mode: "local-fallback",
      warning: `OpenAI API error: ${data.error?.message || response.statusText}. Using local deterministic analysis.`,
      ...fallback
    };
  }

  const parsed = JSON.parse(extractOutputText(data));
  const trackerRow = [
    input.company || "",
    input.role || "",
    input.location || "",
    input.source || "",
    "",
    parsed.optRisk,
    "Need confirm",
    parsed.fitLevel,
    "Target",
    new Date().toISOString().slice(0, 10),
    "",
    parsed.trackerNotes
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");

  return {
    mode: "openai",
    requirements: {
      skills: [],
      roleSignals: [parsed.roleType],
      riskSignals: parsed.recruiterQuestions,
      seniority: "LLM analyzed"
    },
    match: {
      matched: [],
      missing: parsed.missingSkills,
      score: parsed.fitScore,
      fitLevel: parsed.fitLevel
    },
    optRisk: parsed.optRisk,
    summary: parsed.summary,
    bullets: parsed.tailoredBullets.join("\n"),
    message: parsed.outreachMessage,
    trackerRow
  };
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("No output text returned from OpenAI API.");
}
