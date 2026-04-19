import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://leyknlchjkgebdiwzdga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxleWtubGNoamtnZWJkaXd6ZGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjE4NjEsImV4cCI6MjA5MjE5Nzg2MX0.4mvp4upkwUgNpZBnUYEklYm6O7TI3bQPUR6ofDmLX7Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
