// Test the API route directly
async function testAPI() {
  try {
    const res = await fetch("https://tuhuipotecafacil-crm2026-beige.vercel.app/api/leads");
    const data = await res.json();
    console.log("API Response:", JSON.stringify(data).substring(0, 200));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

testAPI();
