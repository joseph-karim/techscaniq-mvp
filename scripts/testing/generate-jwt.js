import jwt from 'jsonwebtoken';

// Use environment variable for JWT secret
const secret = process.env.SUPABASE_JWT_SECRET || 'your-jwt-secret-here';

if (secret === 'your-jwt-secret-here') {
  console.error('Error: Please set SUPABASE_JWT_SECRET environment variable');
  process.exit(1);
}

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