const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// تحميل المتغيرات البيئية
dotenv.config({ path: './.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📌 Routes - التصحيح هنا
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);  // ✅ هذا صحيح إذا كان authRoutes هو router

// Route de test
app.get('/', (req, res) => {
  res.json({ message: '🚀 TaskFlow API is running' });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
  });
});

// Route d'erreur globale
app.use((err, req, res, next) => {
  console.error('❌ Erreur globale:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Erreur interne du serveur',
  });
});

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb:27017/taskflow')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Routes disponibles:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
});