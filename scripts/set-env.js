const TOKEN = "vcp_8O7rk2x9ECbgBxGc2DBPaINmLnmDfWcbZ1nZW60jUn4IOf7jhB4TOpH0";
const PROJECT = "tuhuipotecafacil-crm2026";
const BASE = "https://api.vercel.com/v10";

async function updateEnv(id, key, value) {
  const res = await fetch(`${BASE}/projects/${PROJECT}/env/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: value,
      target: ["production"],
    }),
  });
  const data = await res.json();
  console.log(`${key}:`, res.ok ? "UPDATED" : data.error?.message || "Error");
}

// Get existing env vars
async function getEnvVars() {
  const res = await fetch(`${BASE}/projects/${PROJECT}/env`, {
    headers: { "Authorization": `Bearer ${TOKEN}` },
  });
  return await res.json();
}

async function main() {
  const envVars = await getEnvVars();
  
  for (const env of envVars.env || []) {
    if (env.key === "NEXT_PUBLIC_SUPABASE_URL") {
      await updateEnv(env.id, env.key, "https://dcoyjvbhrkarrmetrhiv.supabase.co");
    }
    if (env.key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      await updateEnv(env.id, env.key, "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");
    }
  }
  console.log("Done");
}

main();
