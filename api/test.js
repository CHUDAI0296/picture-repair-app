module.exports = async function handler(req, res) {
  try {
    res.json({ message: "API is working!", timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 