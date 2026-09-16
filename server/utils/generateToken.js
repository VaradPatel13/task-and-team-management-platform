import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for the given user ID.
 * @param {string} id - The user's MongoDB ObjectId
 * @param {boolean} [rememberMe=false] - If true, token lasts 30 days; otherwise 24 hours
 * @returns {string} Signed JWT string
 */
const generateToken = (id, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : '24h';
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

export default generateToken;
