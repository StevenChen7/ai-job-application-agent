const SKILL_TERMS = {
  "AI Agents": ["ai agent", "agents", "agentic", "multi-agent", "autonomous agent"],
  RAG: ["rag", "retrieval", "vector database", "embedding", "embeddings", "reranking"],
  "Prompt Engineering": ["prompt", "prompting", "structured output", "json schema"],
  "Workflow Automation": ["workflow", "automation", "automate", "zapier", "n8n", "make", "webhook"],
  Python: ["python"],
  JavaScript: ["javascript", "typescript", "node"],
  SQL: ["sql", "postgres", "mysql", "database"],
  APIs: ["api", "apis", "rest", "graphql", "integration"],
  Flask: ["flask"],
  Docker: ["docker", "container"],
  Git: ["git", "github"],
  "Data Validation": ["data validation", "data quality", "debugging", "troubleshooting", "qa"],
  "Customer Solutions": ["customer", "implementation", "onboarding", "solutions", "support"],
  "Machine Learning": ["machine learning", "ml", "model", "classification", "prediction"],
  "Search/Text": ["search", "tf-idf", "cosine similarity", "text processing", "nlp"]
};

const DEFAULT_PROFILE = {
  name: "Zhuo Chen",
  headline: "Computer Engineering / Computer Science graduate with software, data validation, and AI workflow automation experience",
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
    "AI Agents",
    "workflow automation",
    "prompt design"
  ],
  experience: [
    "Software development and database maintenance at Xiyin (Shein)",
    "Data validation, debugging, troubleshooting, and system reliability work",
    "REST API project using Flask, MySQL, Postman, and Docker",
    "Search/text processing project using TF-IDF and cosine similarity",
    "AI job application workflow for JD parsing, tailoring, and tracker management"
  ],
  workAuthorizationNote: "Currently authorized for post-completion OPT and eligible for STEM OPT extension; needs E-Verify and Form I-983 support."
};

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAny(text, terms) {
  const normalized = normalize(text);
  return terms.some((term) => normalized.includes(term));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function extractRequirements(jobDescription) {
  const jd = normalize(jobDescription);
  const skills = Object.entries(SKILL_TERMS)
    .filter(([, terms]) => hasAny(jd, terms))
    .map(([skill]) => skill);

  const roleSignals = [];
  if (hasAny(jd, ["customer", "implementation", "onboarding", "solutions", "support"])) {
    roleSignals.push("customer-facing implementation");
  }
  if (hasAny(jd, ["ai", "llm", "agent", "rag", "automation"])) {
    roleSignals.push("applied AI workflow");
  }
  if (hasAny(jd, ["backend", "api", "database", "infrastructure"])) {
    roleSignals.push("backend/data systems");
  }
  if (hasAny(jd, ["new grad", "early career", "entry level"])) {
    roleSignals.push("new-grad friendly");
  }

  const riskSignals = [];
  if (hasAny(jd, ["us citizen/visa only", "visa only", "no visa sponsorship", "sponsorship not available"])) {
    riskSignals.push("visa language needs clarification");
  }
  if (hasAny(jd, ["e-verify", "stem opt", "i-983"])) {
    riskSignals.push("STEM OPT language found");
  }
  if (hasAny(jd, ["relocate", "onsite", "in office", "office"])) {
    riskSignals.push("location or relocation requirement");
  }

  const seniority = hasAny(jd, ["senior", "staff", "principal", "lead"])
    ? "senior or stretch"
    : hasAny(jd, ["new grad", "entry level", "junior", "early career"])
      ? "new grad or entry"
      : "not specified";

  return {
    skills,
    roleSignals: unique(roleSignals),
    riskSignals: unique(riskSignals),
    seniority
  };
}

export function matchCandidate(requirements, profile = DEFAULT_PROFILE) {
  const profileText = normalize([...profile.skills, ...profile.experience].join(" "));
  const matched = requirements.skills.filter((skill) => {
    const terms = SKILL_TERMS[skill] || [skill];
    return hasAny(profileText, terms) || profileText.includes(normalize(skill));
  });
  const missing = requirements.skills.filter((skill) => !matched.includes(skill));
  const base = requirements.skills.length ? matched.length / requirements.skills.length : 0.55;
  const roleBonus = requirements.roleSignals.includes("new-grad friendly") ? 0.1 : 0;
  const score = Math.min(95, Math.round((base * 75) + roleBonus * 100 + 12));

  return {
    matched,
    missing,
    score,
    fitLevel: score >= 75 ? "Strong" : score >= 55 ? "Moderate" : "Stretch"
  };
}

export function evaluateOptRisk(jobDescription, location = "") {
  const text = normalize(`${jobDescription} ${location}`);
  if (hasAny(text, ["us citizen/visa only", "no visa sponsorship", "sponsorship not available"])) return "High";
  if (hasAny(text, ["will sponsor", "sponsor"])) return "Medium";
  if (hasAny(text, ["e-verify", "stem opt", "i-983"])) return "Low";
  return "Need confirm";
}

export function generateApplicationContent({ company, role, location, source, jobDescription, candidateProfile }, profile = DEFAULT_PROFILE) {
  const activeProfile = normalizeProfile(candidateProfile, profile);
  const requirements = extractRequirements(jobDescription);
  const match = matchCandidate(requirements, activeProfile);
  const optRisk = evaluateOptRisk(jobDescription, location);
  const cleanCompany = company || "the company";
  const cleanRole = role || "this role";
  const cleanLocation = location || "not specified";
  const cleanSource = source || "manual entry";

  const summary = [
    `Company: ${cleanCompany}`,
    `Role: ${cleanRole}`,
    `Location: ${cleanLocation}`,
    `Seniority: ${requirements.seniority}`,
    `Role signals: ${requirements.roleSignals.join(", ") || "not enough data"}`,
    `Matched skills: ${match.matched.join(", ") || "none detected"}`,
    `Missing or learning focus: ${match.missing.join(", ") || "none detected"}`,
    `Candidate: ${activeProfile.name || "Candidate"}`,
    `OPT follow-up: ${activeProfile.workAuthorizationNote || "Confirm work authorization requirements before final acceptance."}`
  ].join("\n");

  const bullets = [
    `Supported software and data workflows through database maintenance, data validation, debugging, and issue investigation.`,
    `Built REST API and backend data projects using Python, Flask, MySQL, Postman, and Docker to practice structured system workflows.`,
    `Designed an AI-assisted job application workflow to parse job descriptions, extract requirements, generate tailored materials, and track follow-ups.`,
    `Applied search and text-processing concepts, including TF-IDF and cosine similarity, to improve document matching and relevance review.`
  ].join("\n");

  const message = [
    `Hi ${cleanCompany} team,`,
    "",
    `I am ${activeProfile.name || "a candidate"}, ${activeProfile.headline || "with experience in software, data workflows, and AI automation."}`,
    "",
    `${cleanCompany} interests me because the ${cleanRole} role connects practical software work with real business workflows. I am especially interested in roles where I can work close to users, understand operational problems, build or support technical systems, and help make AI-enabled workflows more reliable.`,
    "",
    `My strongest foundation is in backend/data workflows, troubleshooting, documentation, and structured problem solving. I would be excited to contribute while growing deeper in applied AI, automation, and production workflow systems.`
  ].join("\n");

  const csvRow = [
    cleanCompany,
    cleanRole,
    cleanLocation,
    cleanSource,
    "",
    optRisk,
    "Need confirm",
    match.fitLevel,
    "Target",
    new Date().toISOString().slice(0, 10),
    "",
    "Generated by AI Job Application Agent"
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");

  return {
    requirements,
    match,
    optRisk,
    summary,
    bullets,
    message,
    trackerRow: csvRow
  };
}

export { DEFAULT_PROFILE };

function normalizeProfile(candidateProfile, fallback) {
  if (!candidateProfile) return fallback;
  return {
    name: candidateProfile.name || fallback.name,
    headline: candidateProfile.headline || fallback.headline,
    skills: Array.isArray(candidateProfile.skills) && candidateProfile.skills.length ? candidateProfile.skills : fallback.skills,
    experience: Array.isArray(candidateProfile.experience) && candidateProfile.experience.length ? candidateProfile.experience : fallback.experience,
    workAuthorizationNote: candidateProfile.workAuthorizationNote || fallback.workAuthorizationNote
  };
}
