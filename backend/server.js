// backend/server.js
// Backend conectado ao Supabase (PostgreSQL)
const express = require('express');
require('dotenv').config();
const cors = require('cors');
// const sqlite3 = require('sqlite3').verbose(); // DEPRECATED
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PagarmeClient = require('./pagarmeClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'seu_secret_jwt_super_secreto'; // MUDE ISSO EM PRODUÇÃO!

// OTP Store (In-Memory for now)
const otpStore = new Map(); // Key: Phone, Value: { code, expiresAt }

// Supabase Config
const supabaseUrl = process.env.SUPABASE_URL || 'https://bnkijzgiyvieqourlhzl.supabase.co';
// Use Service Role Key for Backend operations if available (Permissions Bypass), otherwise fallback to Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua2lqemdpeXZpZXFvdXJsaHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjcyMDQsImV4cCI6MjA4MzgwMzIwNH0.akBcInRwr1HcWauNSpgaEL1D-pQa3nZFA6Bu2PpyU2I';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(cors());
app.use(express.json());
// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer (Mantido Local por enquanto, ideal seria Storage)
// Configuração do Multer para Memória (Correto para Vercel)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas!'));
  }
});

console.log('✅ Conectado ao Supabase!');

// Middleware de autenticação
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });

    // Fetch user from Supabase
    const { data: user, error } = await supabase.from('users').select('*').eq('id', decoded.id).single();

    if (error || !user) {
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }
    req.user = user;
    next();
  });
}

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Registro
app.post('/api/auth/register', async (req, res) => {
  const { full_name, email } = req.body;

  // Check if exists
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
  if (existingUser) return res.status(400).json({ error: 'Email já cadastrado' });

  const { data: newUser, error } = await supabase.from('users').insert({
    full_name,
    email,
    password: 'demo123', // Demo password
    user_type: 'customer'
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });

  const token = jwt.sign({
    id: newUser.id,
    email: newUser.email,
    user_type: newUser.user_type,
    establishment_role: newUser.establishment_role
  }, JWT_SECRET);

  res.json({ token, user: newUser });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;

  let { data: user } = await supabase.from('users').select('*').eq('email', email).single();

  if (!user) {
    // Auto-create demo user if not found
    const { data: newUser, error } = await supabase.from('users').insert({
      full_name: 'Usuário Demo',
      email,
      password: 'demo123',
      user_type: 'customer'
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    user = newUser;
  }

  const token = jwt.sign({
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    establishment_role: user.establishment_role
  }, JWT_SECRET);

  res.json({ token, user });
});

// Get Me
app.get('/api/users/me', authenticateToken, async (req, res) => {
  // req.user comes from authenticateToken (decoded token)
  // But establishing role might be updated in DB, so let's fetch fresh.
  const { data: user, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(user);
});

// Change Password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  // 1. Get current password from DB to verify
  const { data: user, error } = await supabase.from('users').select('password').eq('id', req.user.id).single();

  if (error || !user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // 2. Verify Old Password (Simple string comparison for now as per system)
  if (user.password !== oldPassword) {
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }

  // 3. Update Password
  const { error: updateError } = await supabase.from('users').update({ password: newPassword }).eq('id', req.user.id);

  if (updateError) {
    return res.status(500).json({ error: 'Erro ao atualizar senha.' });
  }

  res.json({ success: true, message: 'Senha atualizada com sucesso.' });
});

// ==================== OTP AUTH ROUTES (EMAIL + PIN) ====================

const { Resend } = require('resend');

// Helper: Send Email via Resend
async function sendEmailOTP(email, code) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey || resendApiKey === '123') {
    console.log(`\n[EMAIL MOCK] To: ${email} | Code: ${code}\n`);
    return true;
  }

  const resend = new Resend(resendApiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'EzDrink <noreply@ezdrink.com.br>', // Must match verified domain
      to: [email],
      subject: 'Seu código de acesso EzDrink',
      html: `<div style="font-family: sans-serif; text-align: center;">
              <h2>Seu código de acesso</h2>
              <h1 style="font-size: 32px; letter-spacing: 5px; color: #333;">${code}</h1>
              <p>Este código expira em 5 minutos.</p>
             </div>`
    });

    if (error) {
      console.error("[RESEND ERROR]", error);
      return false;
    }

    console.log(`[RESEND] Email enviado para ${email}`);
    return true;
  } catch (error) {
    console.error("[RESEND EXCEPTION]", error);
    return false;
  }
}

// 1. Request OTP (Email)
app.post('/api/auth/otp/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail obrigatório' });

  // Generate 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  // Store in memory (email -> code)
  otpStore.set(email, { code, expiresAt });

  const sent = await sendEmailOTP(email, code);

  if (!sent && process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Erro ao enviar E-mail.' });
  }

  res.json({ success: true, message: 'Código enviado para o e-mail.' });
});

// 2. Verify OTP
app.post('/api/auth/otp/verify', async (req, res) => {
  const { email, code } = req.body;

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ error: 'Código não encontrado ou expirado.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'Código expirado.' });
  }

  if (record.code !== code) {
    return res.status(400).json({ error: 'Código incorreto.' });
  }

  // OTP Valid! Now check if user exists
  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();

  if (user) {
    // User exists -> Ask for PIN
    otpStore.delete(email);
    return res.json({ success: true, action: 'login_pin', message: 'Código correto. Digite seu PIN.' });
  } else {
    // New User -> Registration
    return res.json({ success: true, action: 'register', message: 'Código correto. Complete o cadastro.' });
  }
});

// 2.5 RESET PIN (Forgot Password)
app.post('/api/auth/reset-pin', async (req, res) => {
  const { email, code, pin, cpf } = req.body;

  // 1. Verify OTP
  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ error: 'Código não encontrado ou expirado.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'Código expirado.' });
  }

  if (record.code !== code) {
    return res.status(400).json({ error: 'Código incorreto.' });
  }

  // 2. Fetch User & Verify CPF
  const { data: user, error: userError } = await supabase.from('users').select('*').eq('email', email).single();

  if (userError || !user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Simple CPF normalization for comparison (removes non-digits)
  const normalizedUserCpf = user.cpf ? user.cpf.replace(/\D/g, '') : '';
  const normalizedInputCpf = cpf ? cpf.replace(/\D/g, '') : '';

  if (normalizedUserCpf !== normalizedInputCpf) {
    return res.status(400).json({ error: 'CPF incorreto.' });
  }

  // 3. Update User Password
  const { error: updateError } = await supabase.from('users').update({ password: pin }).eq('email', email);

  if (updateError) {
    console.error("Erro reset PIN:", updateError);
    return res.status(500).json({ error: 'Erro ao atualizar PIN.' });
  }

  // 4. Consume OTP
  otpStore.delete(email);

  res.json({ success: true, message: 'PIN alterado com sucesso! Faça login.' });
});

// 3. Login with PIN (Existing User)
app.post('/api/auth/login-pin', async (req, res) => {
  const { email, pin } = req.body;

  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();

  if (error || !user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Verify PIN (Stored in password field)
  if (user.password !== pin) {
    return res.status(401).json({ error: 'PIN incorreto.' });
  }

  const token = jwt.sign({
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    establishment_role: user.establishment_role
  }, JWT_SECRET);

  res.json({ success: true, token, user });
});

// 4. Register (New User)
app.post('/api/auth/otp/register', async (req, res) => {
  const { email, code, pin, full_name, cpf, phone } = req.body;

  // Re-verify OTP to prevent direct API calls without validation
  const record = otpStore.get(email);
  if (!record || record.code !== code) {
    return res.status(400).json({ error: 'Sessão expirada ou inválida. Reinicie o login.' });
  }

  // Create User
  const { data: newUser, error } = await supabase.from('users').insert([{
    full_name,
    email,
    password: pin, // Store PIN as password
    phone,
    cpf,
    user_type: 'customer'
  }]).select().single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Algum dado já está em uso (E-mail ou CPF).' });
    }
    return res.status(400).json({ error: error.message });
  }

  otpStore.delete(email); // Cleanup

  const token = jwt.sign({
    id: newUser.id,
    email: newUser.email,
    user_type: newUser.user_type,
    establishment_role: newUser.establishment_role
  }, JWT_SECRET);

  res.json({ token, user: newUser });
});


// Update Me
app.put('/api/users/me', authenticateToken, async (req, res) => {
  const { cpf, birth_date, full_name, phone } = req.body;

  const updates = {};
  if (cpf) updates.cpf = cpf;
  if (birth_date) updates.birth_date = birth_date;
  if (full_name) updates.full_name = full_name;
  if (phone) updates.phone = phone;

  const { error } = await supabase.from('users').update(updates).eq('email', req.user.email);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Phone Auth Routes
app.post('/api/auth/check-phone', async (req, res) => {
  const { phone } = req.body;
  // We assume email = phone@ezdrink.local for phone users
  const email = `${phone.replace(/\D/g, '')}@ezdrink.local`; // (11) 999... -> 11999...@ezdrink.local

  // Check if user exists (by email OR by checking phone column if it existed, but email is safer unique key)
  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
  res.json({ exists: !!user, name: user?.full_name });
});

// GENERATE TEAM MEMBER
app.post('/api/establishment/team/generate', authenticateToken, async (req, res) => {
  if (req.user.user_type !== 'admin' && req.user.establishment_role !== 'manager') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { name, role } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Dados incompletos' });

  // Generate easy credentials
  const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000); // 4 digits

  // Email: name.rand@ezdrink.local (e.g. carlos.1234@ezdrink.local)
  // Password: 4 digit PIN (e.g. 5678)
  const email = `${firstName}.${rand}@ezdrink.local`;
  const password = Math.floor(1000 + Math.random() * 9000).toString();

  const { data: newUser, error } = await supabase.from('users').insert({
    full_name: name,
    email: email,
    password: password, // Plain text for simplicity/demo as per user request for PIN style
    user_type: 'customer',
    establishment_role: role,
    phone: '00000000000', // Dummy
    cpf: `000.${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}-00` // Dummy
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    success: true,
    user: newUser,
    credentials: { email, password }
  });
});

// DELETE TEAM MEMBER
app.delete('/api/establishment/team/:id', authenticateToken, async (req, res) => {
  if (req.user.user_type !== 'admin' && req.user.establishment_role !== 'manager') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { id } = req.params;
  const { error } = await supabase.from('users').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/auth/register-phone', async (req, res) => {
  const { full_name, phone, cpf, password, email } = req.body;
  const cleanPhone = phone.replace(/\D/g, '');
  const finalEmail = (email || `${cleanPhone}@ezdrink.local`).toLowerCase().trim();

  // 1. Check if exists (Email OR CPF)
  // Note: This requires manually checking because Supabase might not have unique constraint set on CPF yet
  const { data: existingUser } = await supabase.from('users').select('id, email, cpf').or(`email.eq.${finalEmail},cpf.eq.${cpf}`).single();

  if (existingUser) {
    if (existingUser.email === finalEmail) return res.status(400).json({ error: 'Email já cadastrado.' });
    if (existingUser.cpf === cpf) return res.status(400).json({ error: 'CPF já cadastrado.' });
    return res.status(400).json({ error: 'Usuário já existe.' });
  }

  // 2. Create User
  const { data: newUser, error } = await supabase.from('users').insert({
    full_name,
    email: finalEmail,
    password: password,
    cpf,
    phone,
    user_type: 'customer'
  }).select().single();

  if (error) {
    // Parse Postgres Errors to Friendly Messages
    if (error.message.includes('users_email_key')) {
      return res.status(400).json({ error: 'Este email já está sendo usado.' });
    }
    if (error.message.includes('users_cpf_key') || error.message.includes('cpf')) {
      return res.status(400).json({ error: 'Este CPF já está cadastrado.' });
    }
    if (error.message.includes('users_phone_key')) {
      return res.status(400).json({ error: 'Este telefone já está cadastrado.' });
    }
    return res.status(400).json({ error: 'Erro ao criar conta. Tente novamente.' });
  }

  // 2. Generate Token
  const token = jwt.sign({
    id: newUser.id,
    email: newUser.email,
    user_type: newUser.user_type,
    establishment_role: newUser.establishment_role
  }, JWT_SECRET);

  res.json({ token, user: newUser });
});

// Standard Email Login (for Admin)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();

  if (!user || error) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const token = jwt.sign({
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    establishment_role: user.establishment_role
  }, JWT_SECRET);

  res.json({ token, user });
});

app.post('/api/auth/login-phone', async (req, res) => {
  const { phone, password } = req.body;
  const email = `${phone.replace(/\D/g, '')}@ezdrink.local`;

  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();

  if (!user || error) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Compare Password (Simple string for now as register saves plain, or check if 'demo123')
  if (user.password !== password) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const token = jwt.sign({
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    establishment_role: user.establishment_role
  }, JWT_SECRET);

  res.json({ token, user });
});

// ==================== ADMIN / TEAM ROUTES ====================

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.user_type !== 'admin' && req.user.user_type !== 'superadmin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { data: users, error } = await supabase.from('users').select('id, full_name, email, user_type').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(users);
});

app.get('/api/establishment/team', authenticateToken, async (req, res) => {
  if (!['establishment', 'admin', 'superadmin'].includes(req.user.user_type)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  const { data: team, error } = await supabase.from('users').select('*').in('establishment_role', ['waiter', 'barman', 'manager']);
  if (error) return res.status(500).json({ error: error.message });
  res.json(team);
});

app.post('/api/establishment/team/generate', authenticateToken, async (req, res) => {
  if (!['establishment', 'admin'].includes(req.user.user_type)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { name, role } = req.body;
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const email = `${role || 'garcom'}.${cleanName}.${randomSuffix}@ezfest.local`;
  const password = Math.floor(100000 + Math.random() * 900000).toString();

  const { error } = await supabase.from('users').insert({
    full_name: name,
    email,
    password, // Ideally hash this
    user_type: 'user',
    establishment_role: role || 'waiter'
  });

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    success: true,
    message: 'Conta gerada com sucesso',
    credentials: { name, email, password }
  });
});

// ==================== USER DATA ROUTE (Fixes Login Loop) ====================
app.get('/api/users/me', authenticateToken, async (req, res) => {
  // Return the user data decoded from token + any extra DB info if needed
  // Assuming token has id, email, type, role

  // Optional: Refresh from DB to get latest status
  const { data: user, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();

  if (error || !user) {
    // If user deleted from DB but has token, return 401
    return res.status(401).json({ error: 'User not found' });
  }

  res.json(user);
});

// ==================== ADMIN DASHBOARD STATS ====================
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  if (req.user.user_type !== 'admin' && req.user.establishment_role !== 'manager') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    // 1. Fetch Orders to aggregates
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, status, payment_method, items, ticket_code, user_email')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // --- Aggregation Logic ---

    // A. Sales by Hour
    const salesByHour = Array(24).fill(0);
    const countByHour = Array(24).fill(0);

    // B. Product by Hour (Which product sells most at each hour)
    const productsByHour = {}; // { "10": { "Beer": 5, "Fries": 2 } }

    // C. Payment Conversion
    const paymentStats = {
      credit_card: 0,
      pix: 0,
      cash: 0 // boleto usually not used in events, maybe 'cash' or other
    };
    let totalOrders = 0;

    orders.forEach(order => {
      const date = new Date(order.created_at);
      // Adjust to UTC-3 (Brazil) roughly or keep UTC depending on server. 
      // Better to rely on local time. Let's use getHours() which uses server local.
      // Ideally we should handle timezone properly, but MVP:
      let hour = date.getHours();
      // Fix timezone offset manually if server is UTC (likely Vercel is UTC)
      // Brazil is UTC-3. 
      hour = (hour - 3 + 24) % 24;

      salesByHour[hour] += (order.total_amount || 0);
      countByHour[hour] += 1;

      // Payment
      if (order.status === 'paid' || order.status === 'completed') {
        totalOrders++;
        if (order.payment_method === 'credit_card') paymentStats.credit_card++;
        else if (order.payment_method === 'pix') paymentStats.pix++;
        else paymentStats.cash++;
      }

      // Products
      if (order.items && order.items.length > 0) {
        if (!productsByHour[hour]) productsByHour[hour] = {};
        order.items.forEach(item => {
          const name = item.name;
          productsByHour[hour][name] = (productsByHour[hour][name] || 0) + (item.quantity || 1);
        });
      }
    });

    // Resolve Top Product per Hour
    const topProductByHour = Array(24).fill(null);
    for (let h = 0; h < 24; h++) {
      if (productsByHour[h]) {
        const sorted = Object.entries(productsByHour[h]).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          topProductByHour[h] = { name: sorted[0][0], count: sorted[0][1] };
        }
      }
    }

    res.json({
      salesByHour,
      countByHour,
      paymentStats,
      totalOrders,
      topProductByHour,
      recentOrders: orders.slice(0, 10)
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/establishment/team/:id', authenticateToken, async (req, res) => {
  if (!['establishment', 'admin'].includes(req.user.user_type)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  const { error } = await supabase.from('users').update({ establishment_role: null }).eq('id', req.params.id).eq('establishment_role', 'waiter');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==================== PRODUCTS ROUTES (SUPABASE) ====================

app.get('/api/products', async (req, res) => {
  const { data: products, error } = await supabase.from('products').select('*').order('is_popular', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
  const { data: product, error } = await supabase.from('products').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

app.post('/api/products', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, price, category_id, is_popular, image_url: bodyUrl } = req.body;
  let image_url = bodyUrl;

  if (req.file) {
    // Upload to Supabase Storage
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    // Attempt upload
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    // Handle Bucket Not Found (404) -> Auto-create
    if (uploadError && (uploadError.statusCode === '404' || uploadError.message.includes('Bucket not found'))) {
      console.log("Bucket 'products' not found. Creating...");
      const { error: createError } = await supabase.storage.createBucket('products', { public: true });
      if (createError) {
        return res.status(500).json({ error: `Erro: Bucket 'products' inexistente e falha ao criar: ${createError.message}` });
      }
      // Retry upload after creation
      const retry = await supabase.storage
        .from('products')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });
      uploadData = retry.data;
      uploadError = retry.error;
    }

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return res.status(500).json({ error: `Erro no upload: ${uploadError.message} (Code: ${uploadError.statusCode || 'Unknown'})` });
    }

    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    image_url = publicUrlData.publicUrl;
  }

  const { data: newProduct, error } = await supabase.from('products').insert({
    name,
    price: parseFloat(price),
    category_id: parseInt(category_id) || null,
    is_popular: is_popular === 'true' || is_popular === true,
    image_url
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(newProduct);
});

// ==================== BALANCE / WALLET ROUTES ====================

app.get('/api/balance', authenticateToken, async (req, res) => {
  // Simple balance logic: For now we return 0 or fetch from a 'wallets' table if it existed.
  // Since we don't have a dedicated wallets table in the schema I verified, 
  // I will assume for MVP the balance is 0 or associated with User metadata if any.
  // The user reported "..." which means it hangs. We need to return JSON.

  // Future: Fetch from 'transactions' sum
  res.json({ balance: 0.00 });
});

app.put('/api/products/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, price, category_id, is_popular, image_url: bodyUrl } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (price) updates.price = parseFloat(price);
  if (category_id) updates.category_id = parseInt(category_id);
  if (is_popular !== undefined) updates.is_popular = is_popular === 'true' || is_popular === true;
  if (req.file) updates.image_url = `/uploads/${req.file.filename}`;
  else if (bodyUrl) updates.image_url = bodyUrl;

  const { data: updated, error } = await supabase.from('products').update(updates).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(updated);
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ==================== CARDS ROUTES (PAGAR.ME + SUPABASE) ====================

// 1. Save Card (Tokenize Only)
// 1. Save Card (Tokenize Only)
app.post('/api/cards', authenticateToken, async (req, res) => {
  const { number, name, expiry, cvv, cpf, billing, is_foreigner } = req.body;

  if (!number || !name || !expiry || !cvv) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  // Basic Validation for BR users
  if (!is_foreigner && (!cpf || !billing)) {
    return res.status(400).json({ error: 'CPF e Endereço são obrigatórios para cartões nacionais.' });
  }

  try {
    const expMonth = expiry.split('/')[0];
    const expYear = '20' + expiry.split('/')[1];

    // Prepare billing address
    const billingAddress = billing || {
      line_1: 'Rua Desconhecida',
      zip_code: '00000000',
      city: 'N/A',
      state: 'XX',
      country: is_foreigner ? 'US' : 'BR'
    };

    // Ensure object shape matches Pagar.me expectation
    if (billing) {
      billingAddress.line_1 = billing.street + ', ' + billing.number;
      billingAddress.zip_code = billing.zip_code;
      billingAddress.city = billing.city;
      billingAddress.state = billing.state;
      billingAddress.country = billing.country;
    }

    const pagarmeCard = await PagarmeClient.saveCard({
      number,
      holder_name: name,
      exp_month: expMonth,
      exp_year: expYear,
      cvv,
      holder_document: cpf || '00000000000',
      billing_address: billingAddress,
      is_foreigner: is_foreigner,
      email: req.user.email, // Pass email to create customer if needed
      user_id: req.user.id // Pass internal ID if helpful for customer code
    });

    // 2. Save ONLY the ID in Supabase
    const { data: savedCard, error } = await supabase.from('cards').insert({
      user_email: req.user.email,
      brand: pagarmeCard.brand || 'credit_card',
      last4: pagarmeCard.last_four_digits,
      pagarme_card_id: pagarmeCard.id // SECURE: We store the ID, not numbers
    }).select().single();

    if (error) throw error;

    res.json({ success: true, card: savedCard });

  } catch (error) {
    console.error("Save Card Error:", error);
    // Use the upstream status code if available (e.g. 401, 422) or default to 500
    const status = error.response?.status || 500;
    res.status(status).json({
      error: error.message, // This now contains the detailed message from Client
      details: error.response?.data // Send full details for debugging
    });
  }
});

app.get('/api/cards', authenticateToken, async (req, res) => {
  const { data: cards, error } = await supabase.from('cards').select('*').eq('user_email', req.user.email);
  if (error) return res.status(500).json({ error: error.message });
  res.json(cards.map(c => ({
    id: c.id, // Supabase ID
    brand: c.brand,
    last4: c.last4,
    // We do NOT send full_data back because we don't have it!
  })));
});

app.delete('/api/cards/:id', authenticateToken, async (req, res) => {
  const { error } = await supabase.from('cards').delete().eq('id', req.params.id).eq('user_email', req.user.email);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==================== BALANCE & ORDERS (SUPABASE) ====================

// Helper: Get Balance
async function getUserBalance(email) {
  const { data, error } = await supabase.from('users').select('balance').eq('email', email).single();
  if (error || !data) return 0;
  return parseFloat(data.balance || 0);
}

// Helper: Update Balance
async function updateUserBalance(email, amountChange) {
  // Ideally use RPC for atomicity, but for now simple read-write
  const current = await getUserBalance(email);
  const newBalance = current + amountChange;
  if (newBalance < 0) return false;

  const { error } = await supabase.from('users').update({ balance: newBalance }).eq('email', email);
  if (error) {
    console.error("Balance Update Error:", error);
    return false;
  }
  return newBalance;
}


app.get('/api/balance', authenticateToken, async (req, res) => {
  const balance = await getUserBalance(req.user.email);
  res.json({ balance });
});

app.post('/api/balance/add', authenticateToken, async (req, res) => {
  const { amount, payment_method, card_id, card_raw } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });

  // Resolve Card ID (Pagar.me Token)
  let pagarmeCardId = null;

  if (card_id) {
    // If user selected a saved card, fetch its Pagar.me ID from Supabase
    const { data: card } = await supabase.from('cards').select('pagarme_card_id').eq('id', card_id).single();
    if (card) pagarmeCardId = card.pagarme_card_id;
  }

  try {
    const pagarmeOrder = await PagarmeClient.createOrder({
      amount: amount,
      payment_method: payment_method || 'credit_card',
      customer: {
        name: req.user.full_name || 'Cliente',
        email: req.user.email, // Pagar.me will use this
      },
      items: [{
        id: 'bal_' + Date.now(),
        name: 'Adição de Saldo',
        unit_price: amount,
        quantity: 1,
        tangible: false
      }],
      card_id: pagarmeCardId, // Use the Pagar.me Token!
      card_raw: card_raw, // Or raw if provided
      save_card: false
    });

    if (pagarmeOrder.status === 'paid') {
      const newBalance = await updateUserBalance(req.user.email, amount);
      return res.json({ success: true, balance: newBalance, pagarme_id: pagarmeOrder.id });
    } else {
      return res.json({
        success: false,
        message: `Status: ${pagarmeOrder.status}`,
        qr_code: pagarmeOrder.charges ? pagarmeOrder.charges[0].last_transaction.qr_code : null
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no pagamento' });
  }
});


// CREATE ORDER VIA SAVED CARD
app.post('/api/orders/create-card', authenticateToken, async (req, res) => {
  const { cart, card_id } = req.body;
  if (!cart || cart.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });
  if (!card_id) return res.status(400).json({ error: 'Cartão não selecionado' });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + 3.75; // Taxa fixa

  // 1. Resolve Pagar.me ID
  const { data: card, error: cardError } = await supabase.from('cards')
    .select('pagarme_card_id, brand, last4')
    .eq('id', card_id)
    .single();

  if (cardError || !card) {
    return res.status(400).json({ error: 'Cartão inválido ou não encontrado.' });
  }

  try {
    // 2. Charge via Pagar.me
    const pagarmeOrder = await PagarmeClient.createOrder({
      amount: total,
      payment_method: 'credit_card',
      customer: {
        name: req.user.full_name || 'Cliente',
        email: req.user.email,
        // Clean CPF (remove non-digits) or use a generated valid one if empty/invalid
        document: (req.user.cpf && req.user.cpf.replace(/\D/g, '').length === 11)
          ? req.user.cpf.replace(/\D/g, '')
          : '11111111111',
        phones: { // Add required phone structure if needed
          mobile_phone: {
            country_code: '55',
            area_code: '11',
            number: '999999999'
          }
        }
      },
      items: cart.map(item => ({
        id: String(item.id),
        name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        tangible: true,
        image_url: item.image_url // Persist image URL
      })),
      card_id: card.pagarme_card_id, // The ID Pagar.me knows!
      save_card: false
    });

    if (pagarmeOrder.status === 'paid') {
      // 3. Save Order in DB
      const { data: order, error } = await supabase.from('orders').insert({
        ticket_code: "ORD-" + Math.floor(1000 + Math.random() * 9000),
        user_email: req.user.email,
        total_amount: total,
        payment_method: 'credit_card',
        status: 'ready', // Or 'paid'
        items: cart
      }).select().single();

      if (error) throw error;

      return res.json({ success: true, orderId: order.ticket_code, total });
    } else {
      return res.json({
        success: false,
        error: `Pagamento recusado: ${pagarmeOrder.status}`
      });
    }

  } catch (err) {
    console.error("Order Card Error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/orders/create-balance', authenticateToken, async (req, res) => {
  const { cart } = req.body;
  if (!cart || cart.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + 3.75;

  // Check & Deduct Balance
  const newBalance = await updateUserBalance(req.user.email, -total);
  if (newBalance === false) return res.status(400).json({ error: 'Saldo insuficiente' });

  // Create Order Record
  const { data: order, error } = await supabase.from('orders').insert({
    ticket_code: "BAL-" + Math.floor(1000 + Math.random() * 9000),
    user_email: req.user.email,
    total_amount: total,
    payment_method: 'balance',
    status: 'ready',
    items: cart // Save full JSON
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, orderId: order.ticket_code, total, balance_remaining: newBalance });
});

// CREATE ORDER VIA PIX
app.post('/api/orders/create-pix', authenticateToken, async (req, res) => {
  const { cart } = req.body;
  if (!cart || cart.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + 3.75; // Taxa fixa

  try {
    // 1. Create Pagar.me Pix Order
    const pagarmeOrder = await PagarmeClient.createOrder({
      amount: total,
      payment_method: 'pix',
      customer: {
        name: req.user.full_name || 'Cliente',
        email: req.user.email,
        document: (req.user.cpf && req.user.cpf.replace(/\D/g, '').length === 11) ? req.user.cpf.replace(/\D/g, '') : '11111111111',
      },
      items: cart.map(item => ({
        id: String(item.id),
        name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        tangible: true
      }))
    });

    // 2. Extract QR Code
    let qr_code = null;
    let qr_code_url = null;

    // Pagar.me V5 structure for Pix
    if (pagarmeOrder.charges && pagarmeOrder.charges.length > 0) {
      const tx = pagarmeOrder.charges[0].last_transaction;
      if (tx) {
        qr_code = tx.qr_code;
        qr_code_url = tx.qr_code_url;
      }
    }

    // 3. Save Order in DB (Pending Payment)
    const { data: order, error } = await supabase.from('orders').insert({
      ticket_code: "PIX-" + Math.floor(1000 + Math.random() * 9000),
      user_email: req.user.email,
      total_amount: total,
      payment_method: 'pix',
      status: 'pending_payment', // Waiting for payment
      items: cart,
      pagarme_id: pagarmeOrder.id,
      qr_code: qr_code // Save if needed for future retrieval
    }).select().single();

    if (error) throw error;

    res.json({
      success: true,
      orderId: order.ticket_code,
      total,
      qr_code: qr_code,
      qr_code_url: qr_code_url
    });

  } catch (err) {
    console.error("Pix Order Error:", err);
    // Return the actual error message from Pagar.me client
    res.status(500).json({ error: err.message || "Erro desconhecido ao criar Pix" });
  }
});




// CREATE ORDER VIA APPLE PAY (Placeholder / Prepared)
app.post('/api/orders/create-apple-pay', authenticateToken, async (req, res) => {
  const { cart, token } = req.body;
  // In a real scenario, frontend sends the Apple Pay token/blob here.

  if (!cart || cart.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + 3.75;

  try {
    // 1. Create Pagar.me Order with Apple Pay Token
    // This is "prepared" - effectively it would use the credit_card method with specific token data
    /*
    const pagarmeOrder = await PagarmeClient.createOrder({
      amount: total,
      payment_method: 'credit_card',
      card_token: token, // Apple Pay token often behaves like a card token or requires specific 'wallet' parameter
      metadata: { source: 'apple_pay' },
      ...
    });
    */

    // For now, we simulate success to allow UI testing if frontend enables it
    const orderCode = "APL-" + Math.floor(1000 + Math.random() * 9000);

    const { data: order, error } = await supabase.from('orders').insert({
      ticket_code: orderCode,
      user_email: req.user.email,
      total_amount: total,
      payment_method: 'apple_pay',
      status: 'paid', // Apple Pay usually confirms instantly
      items: cart
    }).select().single();

    if (error) throw error;

    res.json({ success: true, orderId: order.ticket_code, total });

  } catch (err) {
    console.error("Apple Pay Error:", err);
    res.status(500).json({ error: "Erro ao processar Apple Pay" });
  }
});


// ==================== GROUP ORDERS / BILL SPLITTING ====================

// 1. Create Group Order (Split Bill)
app.post('/api/group-orders', authenticateToken, async (req, res) => {
  const { cart, members } = req.body; // members: [{ email: '...', amount?: 100 }, ...] OR just emails if equal split

  if (!cart || cart.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });
  // Allow empty members (just host creating the lobby)
  // if (!members || members.length === 0) return res.status(400).json({ error: 'Nenhum membro convidado' });

  // Calculate Total
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + 3.75; // Taxa logic

  // Assume equal split for MVP if specific amounts not provided
  // Validation: Sum of shares must equal Total? 
  // For simplicity MVP: Divide equally by (members.length + 1 [host])
  const membersCount = members ? members.length : 0;
  const totalPeople = membersCount + 1;
  const sharePrice = parseFloat((total / totalPeople).toFixed(2));

  // Fix rounding error by giving remainder to host or first member? 
  // Let's just store specific shares.

  try {
    // 1. Create Main Order (Pending Group)
    const orderTicket = "GRP-" + Math.floor(1000 + Math.random() * 9000);
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      ticket_code: orderTicket,
      user_email: req.user.email,
      total_amount: total,
      payment_method: 'split',
      status: 'pending_group', // New Status
      items: cart
    }).select().single();

    if (orderError) throw orderError;

    // 2. Create Group Order Record
    const { data: groupOrder, error: grpError } = await supabase.from('group_orders').insert({
      order_id: order.id,
      total_amount: total,
      status: 'pending',
      created_by: req.user.email
    }).select().single();

    if (grpError) throw grpError;

    // 3. Add Members
    // Host Share
    const safeMembers = members || [];
    const hostShare = (total - (sharePrice * safeMembers.length)).toFixed(2); // Adjust remainder

    const membersData = [
      {
        group_order_id: groupOrder.id,
        email: req.user.email,
        share_amount: hostShare,
        status: 'pending' // Host usually pays immediately after creation, but logically is pending
      },
      ...safeMembers.map(m => ({
        group_order_id: groupOrder.id,
        email: m.email,
        share_amount: sharePrice,
        status: 'pending'
      }))
    ];

    const { error: membersError } = await supabase.from('group_order_members').insert(membersData);
    if (membersError) throw membersError;

    // 4. Send Emails (Mock)
    if (members && members.length > 0) {
      members.forEach(m => {
        console.log(`[EMAIL SEND] To: ${m.email} | Subject: Dividir Conta EzDrink | Link: app/pay-split/${groupOrder.id}?email=${m.email}`);
      });
    }

    res.json({ success: true, groupOrderId: groupOrder.id, orderTicket });

  } catch (err) {
    console.error("Group Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Pay Share (Individual)
app.post('/api/group-orders/:id/pay', async (req, res) => {
  const { id } = req.params; // group_order_id
  const { email, payment_method, card_data } = req.body;
  // NOTE: This endpoint might be public for guests or require guest auth?
  // Use email to identify member.

  try {
    // 1. Find Member Record
    const { data: member, error: memberError } = await supabase.from('group_order_members')
      .select('*')
      .eq('group_order_id', id)
      .eq('email', email)
      .single();

    if (memberError || !member) return res.status(404).json({ error: 'Membro não encontrado ou email incorreto.' });

    if (member.status === 'paid') return res.status(400).json({ error: 'Esta parte já foi paga.' });

    // 2. Process Payment (Mock or Pagar.me)
    // For MVP, if method is 'simulated' or passed, just approve.
    // In real env, do PagarmeClient.createOrder for `member.share_amount`
    console.log(`Processing share payment for ${email}: R$ ${member.share_amount}`);

    // If Pagar.me needed, do it here. For now, simulate success.

    // 3. Mark as Paid
    const { error: updateError } = await supabase.from('group_order_members')
      .update({
        status: 'paid',
        payment_method: payment_method || 'unknown',
        paid_at: new Date().toISOString()
      })
      .eq('id', member.id);

    if (updateError) throw updateError;

    // 4. Check if Group Order is Complete
    const { data: allMembers } = await supabase.from('group_order_members')
      .select('status')
      .eq('group_order_id', id);

    const allPaid = allMembers.every(m => m.status === 'paid');

    if (allPaid) {
      // Update Group Order Status
      await supabase.from('group_orders').update({ status: 'completed' }).eq('id', id);

      // Update Main Order Status -> 'ready' or 'paid'
      const { data: groupOrder } = await supabase.from('group_orders').select('order_id').eq('id', id).single();
      await supabase.from('orders').update({ status: 'ready' }).eq('id', groupOrder.order_id);

      console.log(`Group Order ${id} COMPLETED! Main Order ${groupOrder.order_id} set to READY.`);
    }

    res.json({ success: true, message: 'Pagamento da parte confirmado.', completed: allPaid });

  } catch (err) {
    console.error("Pay Share Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Group Status (Lobby)
app.get('/api/group-orders/:id', async (req, res) => {
  const { data: group, error } = await supabase.from('group_orders').select('*, group_order_members(*)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Grupo não encontrado' });

  // 15-Minute Expiration Logic
  if (group.status === 'pending') {
    const created = new Date(group.created_at).getTime();
    const now = Date.now();
    const diffMinutes = (now - created) / 1000 / 60;

    if (diffMinutes > 15) {
      // Expired! Cancel it.
      await supabase.from('group_orders').update({ status: 'cancelled' }).eq('id', group.id);
      group.status = 'cancelled'; // Return updated status

      // Also cancel the main order if needed?
      // For now just cancel the group lobby.
    }
  }

  res.json(group);
});

// List Orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  let query = supabase.from('orders').select('*, group_orders(*)').order('created_at', { ascending: false });

  // Filter for normal users (non-staff)
  const isStaff = ['waiter', 'barman', 'manager', 'admin', 'superadmin'].includes(req.user.establishment_role);
  const isAdmin = req.user.user_type === 'admin' || req.user.user_type === 'superadmin';

  if (!isStaff && !isAdmin) {
    query = query.eq('user_email', req.user.email);
  }

  const { data: orders, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(orders);
});

// 5. Get Order by Ticket (For Waiter/Admin)
app.get('/api/orders/ticket/:code', async (req, res) => {
  const { data: order, error } = await supabase.from('orders').select('*').eq('ticket_code', req.params.code).single();
  if (error || !order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(order);
});

// 6. Update Order Status (For Waiter/Admin)
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  const { status } = req.body;

  // Update status in Supabase
  // We match by ID (int) or maybe ticket_code if frontend sends that? 
  // Usually frontend sends ID. Supabase IDs are BigInt (int8), so eq('id', id) works.

  const { data: updatedOrder, error } = await supabase.from('orders')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(updatedOrder);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server Supabase running on http://localhost:${PORT}`);
  });
}

module.exports = app;