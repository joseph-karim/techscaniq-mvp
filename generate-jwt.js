import jwt from 'jsonwebtoken';

// Default Supabase local JWT secret
const secret = 'super-secret-jwt-token-with-at-least-32-characters-long';

const token = jwt.sign(
  { 
    role: 'admin', 
    sub: 'admin_id',
    aud: 'authenticated',
    iss: 'supabase-demo'
  },
  secret,
  { expiresIn: '1h' }
);

console.log(token); 