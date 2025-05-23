// API密钥验证和prompt注入处理模块

/**
 * 验证API密钥
 * @param {string} userApiKey - 用户提供的API密钥
 * @returns {boolean} - 验证结果
 */
function verifyApiKey(userApiKey) {
  // 从环境变量获取API密钥
  const envApiKey = process.env.API_KEY || '';
  
  // 如果环境变量中没有设置API密钥，则拒绝所有请求
  if (!envApiKey) {
    console.error('环境变量中未设置API_KEY');
    return false;
  }
  
  // 比对用户提供的API密钥与环境变量中的API密钥
  return userApiKey === envApiKey;
}

/**
 * 获取自定义prompt
 * @returns {string} - 自定义prompt
 */
function getCustomPrompt() {
  return process.env.PROMPT || '';
}

/**
 * 注入自定义prompt到消息中
 * @param {Array} messages - 消息数组
 * @returns {Array} - 注入prompt后的消息数组
 */
function injectPrompt(messages) {
  const customPrompt = getCustomPrompt();
  
  // 如果没有自定义prompt，则直接返回原始消息
  if (!customPrompt) {
    return messages;
  }
  
  // 检查是否已经存在system消息
  const hasSystemMessage = messages.some(msg => msg.role === 'system');
  
  // 如果已经存在system消息，则不注入
  if (hasSystemMessage) {
    return messages;
  }
  
  // 在消息数组开头添加system消息
  return [
    { role: 'system', content: customPrompt },
    ...messages
  ];
}

/**
 * 处理API请求中的密钥验证和prompt注入
 * @param {Object} req - 请求对象
 * @returns {Object} - 处理结果
 */
function processRequest(req) {
  // 从请求头或请求体中获取API密钥
  const authHeader = req.headers?.authorization || '';
  const apiKey = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : (req.body?.apiKey || '');
  
  // 验证API密钥
  const isValidKey = verifyApiKey(apiKey);
  if (!isValidKey) {
    return {
      success: false,
      status: 401,
      error: 'API密钥无效'
    };
  }
  
  // 获取消息
  const messages = req.body?.messages || [];
  
  // 注入自定义prompt
  const processedMessages = injectPrompt(messages);
  
  return {
    success: true,
    apiKey,
    messages: processedMessages
  };
}

module.exports = {
  verifyApiKey,
  getCustomPrompt,
  injectPrompt,
  processRequest
};
