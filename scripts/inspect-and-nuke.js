const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");
async function main() {
  const { data } = await c.from("leads").select("*");
  data.forEach(function(l) {
    console.log(JSON.stringify(l, null, 2));
  });
  await c.from("leads").delete().neq("id", "never-match");
  const { data: after } = await c.from("leads").select("id");
  console.log("After delete:", after.length);
}
main();
