import { generateApplicationContent } from "./agent-core.mjs";

const sampleJob = {
  company: "Confido",
  role: "New Grad Software Engineer",
  location: "New York, NY",
  source: "YC Work at a Startup",
  jobDescription: `Confido is building AI-enabled financial automation and intelligence for CPG brands. The role involves full-stack product engineering, backend systems, APIs, data workflows, and applied AI automation. We are looking for a new grad who can learn quickly, build practical software, work with customer workflows, and support AI-driven business automation. Experience with Python, SQL, APIs, databases, debugging, and product engineering is helpful.`
};

const fields = {
  company: document.querySelector("#company"),
  role: document.querySelector("#role"),
  location: document.querySelector("#location"),
  source: document.querySelector("#source"),
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
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.value.trim()])
  );
}

function writeInput(data) {
  Object.entries(fields).forEach(([key, field]) => {
    field.value = data[key] || "";
  });
}

function analyze() {
  const input = readInput();
  const result = generateApplicationContent(input);
  outputs.fitScore.textContent = `${result.match.score}% ${result.match.fitLevel}`;
  outputs.roleType.textContent = result.requirements.roleSignals[0] || "General";
  outputs.riskLevel.textContent = result.optRisk;
  outputs.summaryOutput.textContent = result.summary;
  outputs.bulletsOutput.textContent = result.bullets;
  outputs.messageOutput.textContent = result.message;
  outputs.trackerOutput.textContent = result.trackerRow;
}

function clearAll() {
  writeInput({});
  outputs.fitScore.textContent = "--";
  outputs.roleType.textContent = "--";
  outputs.riskLevel.textContent = "--";
  outputs.summaryOutput.textContent = "";
  outputs.bulletsOutput.textContent = "";
  outputs.messageOutput.textContent = "";
  outputs.trackerOutput.textContent = "";
}

async function copyOutput(id) {
  const text = document.querySelector(`#${id}`).textContent;
  if (!text) return;
  await navigator.clipboard.writeText(text);
}

document.querySelector("#sampleButton").addEventListener("click", () => {
  writeInput(sampleJob);
  analyze();
});

document.querySelector("#analyzeButton").addEventListener("click", analyze);
document.querySelector("#clearButton").addEventListener("click", clearAll);

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", () => copyOutput(button.dataset.copy));
});
