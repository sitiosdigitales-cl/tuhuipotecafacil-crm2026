const TOKEN = "vcp_8O7rk2x9ECbgBxGc2DBPaINmLnmDfWcbZ1nZW60jUn4IOf7jhB4TOpH0";
const PROJECT = "tuhuipotecafacil-crm2026";

async function redeploy() {
  const res = await fetch(`https://api.vercel.com/v13/deployments?projectId=${PROJECT}`, {
    headers: { "Authorization": `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  if (data.deployments && data.deployments.length > 0) {
    const latest = data.deployments[0];
    console.log("Latest deployment:", latest.url);
    console.log("State:", latest.readyState);
  }
}

redeploy();
