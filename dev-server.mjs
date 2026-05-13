import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateApplicationContent } from "./src/agent-core.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

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
    if (req.method === "POST" && req.url === "/api/analyze") {
      const body = await readJson(req);
      const result = await analyzeWithOpenAI(body);
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
            candidateProfile: {
              name: "Zhuo Chen",
              background: "Computer Engineering / Computer Science graduate",
              skills: [
                "Python",
                "SQL",
                "Flask",
                "MySQL",
                "Docker",
                "Git",
                "Postman",
                "REST APIs",
                "data validation",
                "debugging",
                "database maintenance",
                "Pandas",
                "NumPy",
                "AI workflow automation",
                "prompt design"
              ],
              experience: [
                "Software development and database maintenance at Xiyin (Shein)",
                "Data validation, debugging, troubleshooting, and system reliability work",
                "REST API project using Flask, MySQL, Postman, and Docker",
                "Search/text processing project using TF-IDF and cosine similarity",
                "AI job application workflow project"
              ],
              workAuthorization: "Post-completion OPT; eligible for STEM OPT extension; needs E-Verify and Form I-983 support."
            },
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
