// Vercel API 路由处理 - 聊天完成端点
const { processRequest } = require('./auth');
const { createChatCompletion } = require('./geminiAdapter');

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
      return res.status(processResult.status).json({ error: processResult.error });
    }
    
    const { apiKey, messages } = processResult;
    const options = {
      model: req.body.model,
      temperature: req.body.temperature,
      max_tokens: req.body.max_tokens || req.body.max_completion_tokens,
      stream: req.body.stream
    };
    
    // 调用Gemini API并转换响应
    const response = await createChatCompletion(messages, options, apiKey);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('聊天完成端点错误:', error);
    
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
