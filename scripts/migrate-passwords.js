const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dcoyjvbhrkarrmetrhiv.supabase.co',
  'sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw'
);

async function migratePasswords() {
  const { data: users, error } = await supabase.from('usuarios').select('id, email, password');
  if (error) { console.error('Error:', error); return; }

  console.log('Found', users.length, 'users');

  for (const user of users) {
    if (user.password && user.password.startsWith('$2')) {
      console.log(user.email, '- already hashed, skipping');
      continue;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(user.password || 'demo1234', salt);

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ password: hashed })
      .eq('id', user.id);

    if (updateError) {
      console.error(user.email, '- update failed:', updateError.message);
    } else {
      console.log(user.email, '- password hashed successfully');
    }
  }
}

migratePasswords();
