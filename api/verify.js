// Vercel API 路由处理 - API密钥验证端点
const { verifyApiKey } = require('./auth');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API密钥不能为空' });
    }
    
    const isValid = verifyApiKey(apiKey);
    
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'API密钥无效' });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API密钥验证端点错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误'
    });
  }
};
