// Vercel API 路由处理 - 模型列表端点
const { processRequest } = require('./auth');
const { listModels } = require('./geminiAdapter');

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
    // 从请求头中获取API密钥
    const authHeader = req.headers.authorization || '';
    const apiKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    // 验证API密钥
    const processResult = processRequest({ headers: { authorization: `Bearer ${apiKey}` }, body: {} });
    
    if (!processResult.success) {
      return res.status(processResult.status).json({ error: processResult.error });
    }
    
    // 获取模型列表
    const models = await listModels(apiKey);
    
    res.status(200).json(models);
  } catch (error) {
    console.error('模型列表端点错误:', error);
    
    // 处理Gemini API错误
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        error: {
          message: error.response.data.error?.message || '未知错误',
          type: 'gemini_error',
          code: error.response.data.error?.code || 'unknown'
        }
      });
    }
    
    // 处理其他错误
    res.status(500).json({
      error: {
        message: error.message || '服务器内部错误',
        type: 'server_error'
      }
    });
  }
};
