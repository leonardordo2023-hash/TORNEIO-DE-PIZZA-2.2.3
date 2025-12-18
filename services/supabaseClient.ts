
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihgoxiangtpcflxvnrbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ294aWFuZ3RwY2ZseHZucmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjM4ODAsImV4cCI6MjA4MTYzOTg4MH0.oNRSatY6z0d3jFuwcy6n8vigYb-SVBcJG-xar9e3erQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
