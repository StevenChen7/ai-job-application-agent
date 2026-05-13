const appUrlInput = document.querySelector("#appUrl");
const statusOutput = document.querySelector("#status");

document.querySelector("#importButton").addEventListener("click", importCurrentPage);

async function importCurrentPage() {
  statusOutput.textContent = "Reading current tab...";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab found.");

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: readPage
    });

    const appUrl = appUrlInput.value.replace(/\/+$/, "");
    statusOutput.textContent = "Sending page to local app...";
    const response = await fetch(`${appUrl}/api/import-page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Import failed.");

    statusOutput.textContent = [
      "Imported successfully.",
      `Company: ${data.company || "Unknown"}`,
      `Role: ${data.role || "Unknown"}`,
      "",
      "Return to the app and click Use Imported Page."
    ].join("\n");
  } catch (error) {
    statusOutput.textContent = `Import failed:\n${error.message}`;
  }
}

function readPage() {
  const selectedText = String(window.getSelection?.() || "").trim();
  const main = document.querySelector("main") || document.body;
  return {
    url: location.href,
    title: document.title,
    selectedText,
    text: selectedText || main.innerText || document.body.innerText || ""
  };
}
