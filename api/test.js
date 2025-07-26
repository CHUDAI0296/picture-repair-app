// 简单的测试API
module.exports = async function handler(req, res) {
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
}; 