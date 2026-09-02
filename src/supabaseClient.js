import { createClient } from '@supabase/supabase-js';

// Salin Project URL dan anon key dari Settings -> API Keys di Supabase
const supabaseUrl = 'https://vrjbnfqudqvucrzicyzr.supabase.co/rest/v1/';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyamJuZnF1ZHF2dWNyemljeXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMTc2MjgsImV4cCI6MjEwMzg5MzYyOH0.AA1OqlyeFu_9oNmTqAOXYjnyP5Vw5GgjZAq__hB0kgM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);