import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exqcftmkkjcdakovsaox.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cWNmdG1ra2pjZGFrb3ZzYW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDE5ODksImV4cCI6MjEwMjIxNzk4OX0.cERZf4KchG65c3UZOmtrUOdVE1TjHcXUdX02-YCsOXg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'escalinza14@gmail.com',
    password: 'wrongpassword'
  });

  console.log('Error:', error);
}

testLogin();
