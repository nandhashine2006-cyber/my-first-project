const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and password are required.' });
    }

    const adminUsername = process.env.ADMIN_USERNAME || '';
    const adminEmail = process.env.ADMIN_EMAIL || '';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
    const adminJwtSecret = process.env.ADMIN_JWT_SECRET || '';

    if (process.env.NODE_ENV === 'development') {
      console.log('Admin Auth Configuration Status:');
      console.log(`- ADMIN_USERNAME configured: ${!!adminUsername}`);
      console.log(`- ADMIN_EMAIL configured: ${!!adminEmail}`);
      console.log(`- ADMIN_PASSWORD_HASH configured: ${!!adminPasswordHash}`);
      console.log(`- ADMIN_JWT_SECRET configured: ${!!adminJwtSecret}`);
    }

    const isValidHashPrefix = adminPasswordHash.startsWith('$2a$') || adminPasswordHash.startsWith('$2b$') || adminPasswordHash.startsWith('$2y$');
    if (!isValidHashPrefix) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Warning: ADMIN_PASSWORD_HASH does not seem to be a valid bcrypt hash.');
      }
      return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    const inputId = identifier.trim().toLowerCase();
    const envUser = adminUsername.trim().toLowerCase();
    const envEmail = adminEmail.trim().toLowerCase();

    if (inputId !== envUser && inputId !== envEmail) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { name: adminUsername, role: 'owner-admin' },
      adminJwtSecret,
      { expiresIn: '1h' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000 // 1 hour
    });

    res.json({ success: true, message: 'Logged in successfully.', admin: { name: adminUsername, role: 'owner-admin' } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.logout = (req, res) => {
  res.cookie('admin_token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

exports.me = (req, res) => {
  if (req.admin) {
    res.json({ success: true, admin: req.admin });
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
};
