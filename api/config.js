// Vercel API 路由处理 - 配置端点
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

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 返回配置信息（不包含敏感信息）
    res.status(200).json({
      defaultModel: 'gemini-2.0-flash',
      requiresApiKey: true,
      hasCustomPrompt: !!process.env.PROMPT
    });
  } catch (error) {
    console.error('配置端点错误:', error);
    res.status(500).json({
      error: error.message || '服务器内部错误'
    });
  }
};
