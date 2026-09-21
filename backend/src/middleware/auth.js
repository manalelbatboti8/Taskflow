const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protège une route : vérifie le token JWT envoyé dans le header Authorization
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Non autorisé, aucun token fourni',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Utilisateur lié à ce token introuvable",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Non autorisé, token invalide ou expiré',
    });
  }
};
