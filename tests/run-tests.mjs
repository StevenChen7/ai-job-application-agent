import { generateApplicationContent, extractRequirements, evaluateOptRisk } from "../src/agent-core.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const jd = "We need an AI Operations Analyst to monitor AI agents, review quality, troubleshoot customer conversations, and work with engineering. Python, SQL, APIs, and data validation are helpful. No visa sponsorship available.";

const requirements = extractRequirements(jd);
assert(requirements.skills.includes("AI Agents"), "Expected AI Agents skill");
assert(requirements.skills.includes("Python"), "Expected Python skill");
assert(requirements.skills.includes("SQL"), "Expected SQL skill");

const risk = evaluateOptRisk(jd, "San Francisco");
assert(risk === "High", "Expected high OPT risk");

const result = generateApplicationContent({
  company: "Calltree",
  role: "AI Operations Analyst",
  location: "San Francisco",
  source: "YC",
  jobDescription: jd
});

assert(result.match.score > 0, "Expected fit score");
assert(result.summary.includes("Calltree"), "Expected company in summary");
assert(result.message.includes("Hi Calltree team"), "Expected outreach message");
assert(result.trackerRow.includes("AI Operations Analyst"), "Expected tracker row role");

console.log("All tests passed.");
