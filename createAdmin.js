import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exqcftmkkjcdakovsaox.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cWNmdG1ra2pjZGFrb3ZzYW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDE5ODksImV4cCI6MjEwMjIxNzk4OX0.cERZf4KchG65c3UZOmtrUOdVE1TjHcXUdX02-YCsOXg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  console.log('Creando usuario admin@empresa.com...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@empresa.com',
    password: 'admin123',
    options: {
      data: {
        nombre: 'Administrador',
        role: 'admin'
      }
    }
  });

  if (error) {
    console.error('Error al crear usuario:', error.message);
  } else {
    console.log('Usuario creado exitosamente:', data.user?.email);
    console.log('IMPORTANTE: Verifica si tu Supabase requiere confirmación de correo (por defecto está activado). Si está activado, no podrás loguearte hasta confirmar.');
  }
}

createAdminUser();
