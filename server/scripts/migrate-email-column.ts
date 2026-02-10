import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Test connection
const { data, error } = await supabase.from('auth_users').select('user_id').limit(1);
if (error) {
  console.error('Connection failed:', error);
  process.exit(1);
}
console.log('Connected to Supabase successfully.');
console.log('\n⚠️  Please run this SQL in your Supabase Dashboard → SQL Editor:\n');
console.log(`----- COPY BELOW -----`);
console.log(`
-- Store email for internal use only; never exposed to client or shown in app
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
`);
console.log(`----- COPY ABOVE -----`);
console.log('\nAfter running the SQL, new registrations will store email. Existing rows will have NULL.');
