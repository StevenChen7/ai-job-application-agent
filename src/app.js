import { generateApplicationContent } from "./agent-core.mjs";

const defaultProfile = {
  candidateName: "Zhuo Chen",
  candidateHeadline: "Computer Engineering / Computer Science graduate with software, data validation, and AI workflow automation experience",
  candidateSkills: "Python, SQL, Flask, MySQL, Docker, Git, Postman, REST APIs, data validation, debugging, database maintenance, Pandas, NumPy, AI workflow automation, prompt design",
  candidateExperience: [
    "Software development and database maintenance at Xiyin (Shein)",
    "Data validation, debugging, troubleshooting, and system reliability work",
    "REST API project using Flask, MySQL, Postman, and Docker",
    "Search/text processing project using TF-IDF and cosine similarity",
    "AI job application workflow project"
  ].join("\n"),
  candidateAuthorization: "Post-completion OPT; eligible for STEM OPT extension; needs E-Verify and Form I-983 support."
};

const sampleJob = {
  jobUrl: "",
  company: "Confido",
  role: "New Grad Software Engineer",
  location: "New York, NY",
  source: "YC Work at a Startup",
  jobDescription: `Confido is building AI-enabled financial automation and intelligence for CPG brands. The role involves full-stack product engineering, backend systems, APIs, data workflows, and applied AI automation. We are looking for a new grad who can learn quickly, build practical software, work with customer workflows, and support AI-driven business automation. Experience with Python, SQL, APIs, databases, debugging, and product engineering is helpful.`
};

const fields = {
  jobUrl: document.querySelector("#jobUrl"),
  company: document.querySelector("#company"),
  role: document.querySelector("#role"),
  location: document.querySelector("#location"),
  source: document.querySelector("#source"),
  candidateName: document.querySelector("#candidateName"),
  candidateHeadline: document.querySelector("#candidateHeadline"),
  candidateSkills: document.querySelector("#candidateSkills"),
  candidateExperience: document.querySelector("#candidateExperience"),
  candidateAuthorization: document.querySelector("#candidateAuthorization"),
  jobDescription: document.querySelector("#jobDescription")
};

const outputs = {
  fitScore: document.querySelector("#fitScore"),
  roleType: document.querySelector("#roleType"),
  riskLevel: document.querySelector("#riskLevel"),
  summaryOutput: document.querySelector("#summaryOutput"),
  bulletsOutput: document.querySelector("#bulletsOutput"),
  messageOutput: document.querySelector("#messageOutput"),
  trackerOutput: document.querySelector("#trackerOutput")
};

function readInput() {
  const values = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.value.trim()])
  );
  return {
    company: values.company,
    role: values.role,
    location: values.location,
    source: values.source,
    jobDescription: values.jobDescription,
    candidateProfile: {
      name: values.candidateName,
      headline: values.candidateHeadline,
      skills: splitProfileList(values.candidateSkills),
      experience: splitProfileList(values.candidateExperience),
      workAuthorizationNote: values.candidateAuthorization
    }
  };
}

function writeInput(data) {
  const merged = { ...defaultProfile, ...data };
  Object.entries(fields).forEach(([key, field]) => {
    field.value = merged[key] || "";
  });
}

async function analyze() {
  const input = readInput();
  const result = await analyzeWithApi(input);
  outputs.fitScore.textContent = `${result.match.score}% ${result.match.fitLevel}`;
  outputs.roleType.textContent = result.mode === "openai" ? "OpenAI" : (result.requirements.roleSignals[0] || "General");
  outputs.riskLevel.textContent = result.optRisk;
  outputs.summaryOutput.textContent = result.warning ? `${result.warning}\n\n${result.summary}` : result.summary;
  outputs.bulletsOutput.textContent = result.bullets;
  outputs.messageOutput.textContent = result.message;
  outputs.trackerOutput.textContent = result.trackerRow;
}

async function analyzeWithApi(input) {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return await response.json();
  } catch (error) {
    return {
      mode: "browser-fallback",
      warning: `Local API unavailable: ${error.message}. Using browser fallback.`,
      ...generateApplicationContent(input)
    };
  }
}

function clearAll() {
  writeInput({ ...loadProfile() });
  outputs.fitScore.textContent = "--";
  outputs.roleType.textContent = "--";
  outputs.riskLevel.textContent = "--";
  outputs.summaryOutput.textContent = "";
  outputs.bulletsOutput.textContent = "";
  outputs.messageOutput.textContent = "";
  outputs.trackerOutput.textContent = "";
}

function splitProfileList(value) {
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadProfile() {
  try {
    return { ...defaultProfile, ...JSON.parse(localStorage.getItem("candidateProfile") || "{}") };
  } catch {
    return defaultProfile;
  }
}

function saveProfile() {
  const profile = {
    candidateName: fields.candidateName.value.trim(),
    candidateHeadline: fields.candidateHeadline.value.trim(),
    candidateSkills: fields.candidateSkills.value.trim(),
    candidateExperience: fields.candidateExperience.value.trim(),
    candidateAuthorization: fields.candidateAuthorization.value.trim()
  };
  localStorage.setItem("candidateProfile", JSON.stringify(profile));
  document.querySelector("#profileDialog").close();
}

async function fetchJobFromUrl() {
  const url = fields.jobUrl.value.trim();
  if (!url) {
    outputs.summaryOutput.textContent = "Paste a job URL first.";
    return;
  }
  outputs.summaryOutput.textContent = "Fetching job page...";
  try {
    const response = await fetch("/api/fetch-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const result = await response.json();
    if (!result.ok) {
      outputs.summaryOutput.textContent = `Could not fetch job page.\n\n${result.error}\n\nYou can still paste the job description manually.`;
      return;
    }
    writeInput({
      ...loadProfile(),
      jobUrl: url,
      company: result.company,
      role: result.role,
      location: result.location,
      source: result.source,
      jobDescription: result.jobDescription
    });
    outputs.summaryOutput.textContent = `Job page fetched via ${result.fetchMode}. Review the auto-filled fields, then click Analyze.`;
  } catch (error) {
    outputs.summaryOutput.textContent = `Fetch failed: ${error.message}\n\nYou can still paste the job description manually.`;
  }
}

async function useImportedPage() {
  outputs.summaryOutput.textContent = "Loading imported Chrome page...";
  try {
    const response = await fetch("/api/imported-page");
    const result = await response.json();
    if (!result.ok) {
      outputs.summaryOutput.textContent = `${result.error}\n\nOpen a job page, click the Chrome extension, then return here and click Use Imported Page.`;
      return;
    }
    writeInput({
      ...loadProfile(),
      jobUrl: result.url,
      company: result.company,
      role: result.role,
      location: result.location,
      source: result.source,
      jobDescription: result.jobDescription
    });
    outputs.summaryOutput.textContent = `Imported page from Chrome via ${result.fetchMode}. Review the fields, then click Analyze.`;
  } catch (error) {
    outputs.summaryOutput.textContent = `Import failed: ${error.message}`;
  }
}

writeInput(loadProfile());

async function copyOutput(id) {
  const text = document.querySelector(`#${id}`).textContent;
  if (!text) return;
  await navigator.clipboard.writeText(text);
}

document.querySelector("#sampleButton").addEventListener("click", () => {
  writeInput({ ...loadProfile(), ...sampleJob });
  analyze();
});

document.querySelector("#analyzeButton").addEventListener("click", analyze);
document.querySelector("#clearButton").addEventListener("click", clearAll);
document.querySelector("#fetchJobButton").addEventListener("click", fetchJobFromUrl);
document.querySelector("#useImportedButton").addEventListener("click", useImportedPage);
document.querySelector("#profileButton").addEventListener("click", () => document.querySelector("#profileDialog").showModal());
document.querySelector("#closeProfileButton").addEventListener("click", () => document.querySelector("#profileDialog").close());
document.querySelector("#saveProfileButton").addEventListener("click", saveProfile);
document.querySelector("#resetProfileButton").addEventListener("click", () => writeInput(defaultProfile));

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", () => copyOutput(button.dataset.copy));
});
