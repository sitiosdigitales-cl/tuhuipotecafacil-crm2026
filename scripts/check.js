const {createClient} = require("@supabase/supabase-js");

// Probar con "publishable" (corregido)
const key1 = "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw";
const c1 = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", key1);
c1.from("leads").select("id").limit(1).then(r => {
  console.log("Key publishable:", r.error ? "ERROR: " + r.error.message : "OK - " + (r.data?.length || 0) + " leads");
});

// Probar con "publisible" (tal cual)
const key2 = "sb_publisible_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw";
const c2 = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", key2);
c2.from("leads").select("id").limit(1).then(r => {
  console.log("Key publisible:", r.error ? "ERROR: " + r.error.message : "OK - " + (r.data?.length || 0) + " leads");
});
