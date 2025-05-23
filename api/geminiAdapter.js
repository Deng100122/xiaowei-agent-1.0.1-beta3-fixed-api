// Gemini API 到 OpenAI API 格式转换模块
const axios = require('axios');

// Gemini API 基础URL
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1';

// 默认模型
const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

/**
 * 将 OpenAI 格式的消息转换为 Gemini 格式
 * @param {Array} messages - OpenAI 格式的消息数组
 * @returns {Object} - Gemini 格式的消息
 */
function convertMessagesToGeminiFormat(messages) {
  const geminiMessages = [];
  let systemMessage = null;

  // 提取系统消息（如果存在）
  const systemMessageObj = messages.find(msg => msg.role === 'system');
  if (systemMessageObj) {
    systemMessage = systemMessageObj.content;
  }

  // 转换用户和助手消息
  for (const message of messages) {
    if (message.role === 'system') continue;

    if (message.role === 'user' || message.role === 'assistant') {
      const geminiMessage = {
        role: message.role === 'user' ? 'user' : 'model',
        parts: []
      };

      // 处理文本内容
      if (typeof message.content === 'string') {
        geminiMessage.parts.push({
          text: message.content
        });
      } 
      // 处理数组内容（多模态，但本项目不需要实现）
      else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === 'text') {
            geminiMessage.parts.push({
              text: part.text
            });
          }
        }
      }

      geminiMessages.push(geminiMessage);
    }
  }

  // 如果有系统消息，将其作为用户消息添加到开头
  if (systemMessage && geminiMessages.length > 0) {
    // 确保第一条消息是用户消息
    if (geminiMessages[0].role === 'user') {
      // 将系统消息添加到第一条用户消息前面
      geminiMessages[0].parts.unshift({
        text: `[System Instructions]: ${systemMessage}\n\n[User Message]: `
      });
    } else {
      // 如果第一条不是用户消息，则添加一条新的用户消息
      geminiMessages.unshift({
        role: 'user',
        parts: [{ text: `[System Instructions]: ${systemMessage}` }]
      });
    }
  }

  return { geminiMessages };
}

/**
 * 将 Gemini 响应转换为 OpenAI 格式
 * @param {Object} geminiResponse - Gemini API 响应
 * @param {string} model - 模型名称
 * @returns {Object} - OpenAI 格式的响应
 */
function convertGeminiResponseToOpenAI(geminiResponse, model) {
  const openAIResponse = {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [],
    usage: {
      prompt_tokens: geminiResponse.usageMetadata?.promptTokenCount || 0,
      completion_tokens: geminiResponse.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: (geminiResponse.usageMetadata?.promptTokenCount || 0) + 
                   (geminiResponse.usageMetadata?.candidatesTokenCount || 0)
    }
  };

  // 转换候选项为选择项
  if (geminiResponse.candidates && geminiResponse.candidates.length > 0) {
    openAIResponse.choices = geminiResponse.candidates.map((candidate, index) => {
      return {
        index: index,
        message: {
          role: 'assistant',
          content: candidate.content.parts[0].text
        },
        finish_reason: candidate.finishReason === 'STOP' ? 'stop' : 
                      candidate.finishReason === 'MAX_TOKENS' ? 'length' : 
                      candidate.finishReason === 'SAFETY' ? 'content_filter' : 
                      candidate.finishReason
      };
    });
  }

  return openAIResponse;
}

/**
 * 发送聊天完成请求到 Gemini API
 * @param {Array} messages - OpenAI 格式的消息数组
 * @param {Object} options - 请求选项
 * @param {string} apiKey - Gemini API 密钥
 * @returns {Promise<Object>} - OpenAI 格式的响应
 */
async function createChatCompletion(messages, options = {}, apiKey) {
  try {
    const { 
      model = DEFAULT_MODEL, 
      temperature = 0.7, 
      max_tokens = 1024,
      stream = false
    } = options;

    if (!apiKey) {
      throw new Error('API 密钥是必需的');
    }

    // 转换消息为 Gemini 格式
    const { geminiMessages } = convertMessagesToGeminiFormat(messages);

    // 准备发送到 Gemini API 的请求
    const geminiModel = model.startsWith('gemini-') ? model : DEFAULT_MODEL;
    const geminiRequest = {
      contents: geminiMessages,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: max_tokens,
      }
    };

    // 发送请求到 Gemini API
    const geminiResponse = await axios.post(
      `${GEMINI_API_BASE}/models/${geminiModel}:generateContent`,
      geminiRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        params: {
          alt: 'json'
        }
      }
    );

    // 处理流式响应
    if (stream) {
      // 本项目不实现流式响应
      throw new Error('本版本不支持流式响应');
    }

    // 转换 Gemini 响应为 OpenAI 格式
    return convertGeminiResponseToOpenAI(geminiResponse.data, model);
  } catch (error) {
    console.error('聊天完成请求错误:', error);
    throw error;
  }
}

/**
 * 从 Gemini API 获取可用模型
 * @param {string} apiKey - Gemini API 密钥
 * @returns {Promise<Object>} - OpenAI 格式的响应
 */
async function listModels(apiKey) {
  try {
    if (!apiKey) {
      throw new Error('API 密钥是必需的');
    }

    // 从 Gemini API 获取模型
    const response = await axios.get(
      `${GEMINI_API_BASE}/models`,
      {
        headers: {
          'x-goog-api-key': apiKey
        }
      }
    );

    // 转换为 OpenAI 格式
    return {
      object: 'list',
      data: response.data.models.map(model => ({
        id: model.name.split('/').pop(),
        object: 'model',
        created: Date.now(),
        owned_by: 'google'
      }))
    };
  } catch (error) {
    console.error('获取模型列表错误:', error);
    throw error;
  }
}

/**
 * 简单的聊天函数，用于前端
 * @param {Array} messages - 消息数组
 * @param {string} apiKey - Gemini API 密钥
 * @returns {Promise<string>} - 响应文本
 */
async function simpleChat(messages, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('API 密钥是必需的');
    }

    // 转换消息为 Gemini 格式
    const { geminiMessages } = convertMessagesToGeminiFormat(messages);

    // 准备发送到 Gemini API 的请求
    const geminiRequest = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    };

    // 发送请求到 Gemini API
    const geminiResponse = await axios.post(
      `${GEMINI_API_BASE}/models/${DEFAULT_MODEL}:generateContent`,
      geminiRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        params: {
          alt: 'json'
        }
      }
    );

    // 提取响应文本
    return geminiResponse.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('简单聊天错误:', error);
    throw error;
  }
}

module.exports = {
  createChatCompletion,
  listModels,
  simpleChat,
  convertMessagesToGeminiFormat,
  convertGeminiResponseToOpenAI
};
