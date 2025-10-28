const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // phục vụ index.html

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sid = (req.body.student_id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
    const dir = path.join(__dirname, 'uploads', sid);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${file.fieldname}.jpg`)
});
const upload = multer({ storage });

function emailAllowed(email) {
  const pattern = process.env.ALLOWED_EMAIL_REGEX;
  if (!pattern) return true;
  try { return new RegExp(pattern).test(email); } catch { return true; }
}

const angleMap = {
  face_front: 'FRONT',
  face_left: 'LEFT',
  face_right: 'RIGHT',
  face_up: 'UP',
  face_down: 'DOWN'
};

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post(
  '/api/register',
  upload.fields([
    { name: 'face_front' }, { name: 'face_left' }, { name: 'face_right' },
    { name: 'face_up' }, { name: 'face_down' }
  ]),
  async (req, res) => {
    try {
      const { full_name, student_id, school_email } = req.body;
      if (!full_name || !student_id || !school_email)
        return res.status(400).json({ ok: false, message: 'Thiếu trường bắt buộc' });
      if (!emailAllowed(school_email))
        return res.status(400).json({ ok: false, message: 'Email không thuộc domain cho phép' });

      const exists = await prisma.student.findFirst({
        where: { OR: [{ studentId: student_id }, { schoolEmail: school_email }] }
      });
      if (exists) return res.status(409).json({ ok: false, message: 'Mã SV hoặc Email đã tồn tại' });

      const student = await prisma.student.create({
        data: { fullName: full_name, studentId: student_id, schoolEmail: school_email }
      });

      const files = req.files || {};
      const imagesToCreate = [];
      for (const field of Object.keys(angleMap)) {
        const f = files[field]?.[0];
        if (!f) return res.status(400).json({ ok: false, message: `Thiếu ảnh: ${field}` });
        imagesToCreate.push({
          studentId: student.id,
          angle: angleMap[field],
          filePath: path.relative(__dirname, f.path),
          embedding: null
        });
      }
      await prisma.faceImage.createMany({ data: imagesToCreate });

      res.json({ ok: true, studentId: student.id });
    } catch (e) {
      console.error(e); res.status(500).json({ ok: false, message: 'Server error' });
    }
  }
);

app.get('/api/students', async (req, res) => {
  const list = await prisma.student.findMany({ orderBy: { createdAt: 'desc' }, include: { faceImages: true } });
  res.json({ ok: true, data: list });
});

app.get('/api/students/:id', async (req, res) => {
  const id = Number(req.params.id);
  const s = await prisma.student.findUnique({ where: { id }, include: { faceImages: true } });
  if (!s) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, data: s });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Open http://localhost:3000/index.html to test');
});
