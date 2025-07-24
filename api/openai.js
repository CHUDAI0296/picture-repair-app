// OpenAI API处理函数 - Vercel Serverless Function
import { createClient } from 'openai';

// 初始化OpenAI客户端
const openai = createClient({
  apiKey: process.env.OPENAI_API_KEY // 从环境变量获取API密钥
});

export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, prompt = "Restore this photo, fix any damage, enhance colors, and improve quality." } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // 使用OpenAI的图像编辑API
    const response = await openai.images.edit({
      image: Buffer.from(imageBase64, 'base64'),
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    // 返回处理后的图片URL
    return res.status(200).json({ 
      success: true, 
      data: response.data 
    });
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({ 
      error: 'Error processing image', 
      message: error.message 
    });
  }
} 