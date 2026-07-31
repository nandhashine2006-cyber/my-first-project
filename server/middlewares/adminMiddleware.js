const jwt = require('jsonwebtoken');

const checkAdminAuth = (req, res, next) => {
  const token = req.cookies && req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized admin credentials.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    req.admin = decoded; // { name, role }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Admin session expired or invalid.' });
  }
};

module.exports = { checkAdminAuth };
