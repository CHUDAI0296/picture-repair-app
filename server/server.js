import express from 'express';
import multer from 'multer';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration for international usage
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com'] // Replace with your actual domain
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - important for API cost control
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many image processing requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const processedDir = path.join(__dirname, 'processed');

try {
  await fs.access(uploadsDir);
} catch {
  await fs.mkdir(uploadsDir, { recursive: true });
}

try {
  await fs.access(processedDir);
} catch {
  await fs.mkdir(processedDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY is not set in environment variables');
  process.exit(1);
}

// Helper function to convert image to base64
async function imageToBase64(imagePath) {
  try {
    // Optimize image before processing
    const optimizedBuffer = await sharp(imagePath)
      .resize(1024, 1024, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    return optimizedBuffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

// Helper function to call OpenRouter API
async function callOpenRouterAPI(base64Image) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3001',
        'X-Title': 'Picture Repair App - AI Photo Restoration'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet', // You can change this to other models
        messages: [
          {
            role: 'system',
            content: `You are an expert in photo restoration and enhancement. Your task is to:
            1. Analyze the provided image for damage, fading, scratches, or quality issues
            2. Provide detailed restoration recommendations
            3. Describe what improvements can be made
            4. Focus on color correction, noise reduction, sharpening, and damage repair
            
            Please provide a comprehensive analysis and restoration plan for the image.`
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Please analyze this photo and provide a detailed restoration plan. What damage do you see and how would you fix it?' 
              },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/jpeg;base64,${base64Image}` 
                } 
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

// Helper function to simulate image processing (since AI models can't actually edit images)
async function processImageWithAI(inputPath, analysisResult) {
  try {
    const outputFilename = `processed-${uuidv4()}.jpg`;
    const outputPath = path.join(processedDir, outputFilename);
    
    // Apply basic image enhancements based on AI analysis
    // This is a simulation - in a real app, you'd use specialized image processing libraries
    await sharp(inputPath)
      .resize(2048, 2048, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .sharpen()
      .modulate({
        brightness: 1.1,
        saturation: 1.2,
        hue: 0
      })
      .jpeg({ quality: 95 })
      .toFile(outputPath);
    
    return {
      filename: outputFilename,
      path: outputPath,
      analysis: analysisResult
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

// Main API endpoint for image repair
app.post('/api/repair-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        message: 'Please upload an image file'
      });
    }

    console.log(`📸 Processing image: ${req.file.originalname}`);
    
    // Convert image to base64 for AI analysis
    const base64Image = await imageToBase64(req.file.path);
    
    // Get AI analysis
    console.log('🤖 Analyzing image with AI...');
    const analysisResult = await callOpenRouterAPI(base64Image);
    
    // Process image based on AI analysis
    console.log('🔧 Processing image...');
    const processedResult = await processImageWithAI(req.file.path, analysisResult);
    
    // Clean up original uploaded file
    await fs.unlink(req.file.path);
    
    // Return processed image URL
    const processedImageUrl = `/api/processed/${processedResult.filename}`;
    
    console.log('✅ Image processing completed successfully');
    
    res.json({
      success: true,
      processedImageUrl,
      analysis: processedResult.analysis,
      originalFilename: req.file.originalname,
      processedFilename: processedResult.filename
    });

  } catch (error) {
    console.error('❌ Image processing error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({
      error: 'Image processing failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Serve processed images
app.get('/api/processed/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(processedDir, filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    res.status(404).json({
      error: 'Image not found',
      message: 'The requested processed image does not exist'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Picture Repair API',
    description: 'AI-powered photo restoration service',
    version: '1.0.0',
    endpoints: {
      'POST /api/repair-image': 'Upload and repair an image',
      'GET /api/processed/:filename': 'Download processed image',
      'GET /api/health': 'Health check',
      'GET /api/info': 'API information'
    },
    limits: {
      fileSize: '10MB',
      rateLimit: '10 requests per 15 minutes per IP'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Image file must be smaller than 10MB'
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong processing your request'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Picture Repair API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenRouter API: ${OPENROUTER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api/info`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});