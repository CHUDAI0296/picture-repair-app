// OpenRouter API处理函数 - Vercel Serverless Function
const fetch = require('node-fetch');

// Vercel Serverless Function处理程序
module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, prompt = "Restore this photo, fix any damage, enhance colors, and improve quality." } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    console.log('Processing image with OpenRouter API...');

    // 调用OpenRouter API - 使用正确的格式
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        'HTTP-Referer': req.headers.referer || 'https://picturerepairapp.click',
        'X-Title': 'Picture Repair App'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o', // 使用支持图像的模型
        messages: [
          {
            role: 'system',
            content: 'You are an expert in photo restoration. Your task is to restore and enhance the provided image. Return ONLY the restored image as a base64 encoded string, without any text explanation.'
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: prompt 
              },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high'
                } 
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API Error Response:', errorData);
      throw new Error(`API error: ${response.statusText}, ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('OpenRouter API response received');
    
    // 检查响应格式
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response format');
    }
    
    // 返回处理后的结果
    return res.status(200).json({ 
      success: true, 
      data: data.choices[0].message.content
    });
    
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    return res.status(500).json({ 
      error: 'Error processing image', 
      message: error.message 
    });
  }
} 