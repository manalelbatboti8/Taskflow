const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Fonction pour générer un token JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('📝 Tentative d\'inscription avec:', req.body);

    const { fullName, email, password } = req.body;

    // Validation des champs
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez fournir un nom complet, un email et un mot de passe',
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé',
      });
    }

    // Créer l'utilisateur
    console.log('👤 Création de l\'utilisateur...');
    const user = await User.create({ fullName, email, password });
    console.log('✅ Utilisateur créé avec succès:', user._id);

    // Générer le token
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
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur',
    });
  }
};

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
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
    console.error('❌ Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur',
    });
  }
};