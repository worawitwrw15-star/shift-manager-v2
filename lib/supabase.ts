import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tplyyfvgebfgxetggbpu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbHl5ZnZnZWJmZ3hldGdnYnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2Mzc1MTEsImV4cCI6MjEwNDIxMzUxMX0.12ErMEwdIR-LtCzaqJ7KlyCAhC3KkLdWaAI7weKl0dg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);