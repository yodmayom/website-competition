const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const dns = require('dns');

// บังคับใช้ Google DNS แทน ISP DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb+srv://ozaza2894_db_user:yOHSPHwvmBRYcubp@database.s6nvnqp.mongodb.net/competitiondb?appName=database';

app.use(cors());
app.use(express.json());

// ─── Serve frontend ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/',      (req, res) => res.sendFile(path.join(__dirname, '../frontend', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../frontend', 'admin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend', 'login.html')));

// ─── Uploads ──────────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// ─── MongoDB Schema ───────────────────────────────────────────────────────────
const competitionSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  level:       { type: String, default: 'ไม่ระบุระดับ' },
  deadline:    { type: String, required: true },
  startDate:   { type: String, default: '' },
  description: { type: String, default: '' },
  conditions:  { type: String, default: '' },
  prize:       { type: String, default: '' },
  registerUrl: { type: String, default: '' },
  website:     { type: String, default: '' },
  tags:        { type: [String], default: [] },
  isOpen:      { type: Boolean, default: true },
  imageUrl:    { type: String, default: '' },
}, { timestamps: true });

const Competition = mongoose.model('Competition', competitionSchema);

// ─── Users & Sessions ─────────────────────────────────────────────────────────
const USERS = [
  { username: 'krukerk', password: 'Krukerk',  displayName: 'ครูเกิร์ก' },
  { username: 'Oak',     password: 'OakPhoto', displayName: 'Oak' },
  { username: 'bam',     password: 'bam1234',  displayName: 'Bam' },
];
const sessions = new Map();

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(
    u => u.username.toLowerCase() === (username || '').toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username: user.username, displayName: user.displayName });
  res.json({ success: true, token, displayName: user.displayName });
});

app.post('/api/logout', (req, res) => {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ success: true });
});

function requireAuth(req, res, next) {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!token || !sessions.has(token))
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  req.user = sessions.get(token);
  next();
}

// ─── Upload Image ─────────────────────────────────────────────────────────────
app.post('/api/upload-image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
  res.json({ success: true, imageUrl: '/uploads/' + req.file.filename });
});

// ─── GET all competitions ─────────────────────────────────────────────────────
app.get('/api/competitions', async (req, res) => {
  try {
    const data = await Competition.find().sort({ deadline: 1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET single ───────────────────────────────────────────────────────────────
app.get('/api/competitions/:id', async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: comp });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST create ──────────────────────────────────────────────────────────────
app.post('/api/competitions', requireAuth, async (req, res) => {
  try {
    const comp = new Competition(req.body);
    await comp.save();
    res.status(201).json({ success: true, data: comp });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// ─── PUT update ───────────────────────────────────────────────────────────────
app.put('/api/competitions/:id', requireAuth, async (req, res) => {
  try {
    const comp = await Competition.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!comp) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: comp });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
app.delete('/api/competitions/:id', requireAuth, async (req, res) => {
  try {
    const comp = await Competition.findByIdAndDelete(req.params.id);
    if (!comp) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── PATCH toggle isOpen ──────────────────────────────────────────────────────
app.patch('/api/competitions/:id/toggle', requireAuth, async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ success: false, message: 'Not found' });
    comp.isOpen = !comp.isOpen;
    await comp.save();
    res.json({ success: true, data: comp });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Connect MongoDB then start server ───────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✅  Server running at http://localhost:${PORT}`);
      console.log(`   หน้าหลัก → http://localhost:${PORT}/`);
      console.log(`   Admin    → http://localhost:${PORT}/admin`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });