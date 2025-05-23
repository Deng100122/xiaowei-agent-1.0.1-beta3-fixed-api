// Vercel API 路由处理 - 简单聊天端点
const { processRequest } = require('./auth');
const { simpleChat } = require('./geminiAdapter');

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
    // 处理请求，验证API密钥并注入prompt
    const processResult = processRequest(req);
    
    if (!processResult.success) {
      return res.status(processResult.status).json({ success: false, error: processResult.error });
    }
    
    const { apiKey, messages } = processResult;
    
    // 调用简单聊天函数
    const responseText = await simpleChat(messages, apiKey);
    
    res.status(200).json({ success: true, response: responseText });
  } catch (error) {
    console.error('简单聊天端点错误:', error);
    
    // 处理Gemini API错误
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data.error?.message || '未知错误'
      });
    }
    
    // 处理其他错误
    res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误'
    });
  }
};
