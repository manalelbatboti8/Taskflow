const User = require('../models/User');
const jwt = require('jsonwebtoken');

// GET /api/auth/me — utilisé au rechargement de page pour restaurer la session
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
    },
  });
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// ✅ هاد الراوت ماشي محمي - public
exports.register = async (req, res) => {
  try {
    console.log('📝 Tentative d\'inscription avec:', req.body);

    const { fullName, email, password } = req.body;

    // التأكد من أن جميع الحقول موجودة
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez fournir un nom complet, un email et un mot de passe',
      });
    }

    // ✅ هاد الـ findOne ماشي محمي - كيخدم بلا توثيق
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé',
      });
    }

    // création de l'utilisateur
    const user = await User.create({ fullName, email, password });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur',
    });
  }
};

// ✅ هاد الراوت ماشي محمي - public
exports.login = async (req, res) => {
  try {
    console.log('📝 Tentative de connexion avec:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez fournir un email et un mot de passe',
      });
    }

    // ✅ هاد الـ findOne ماشي محمي
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect',
      });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect',
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur',
    });
  }
};