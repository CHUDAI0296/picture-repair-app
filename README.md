# 🎨 Picture Repair App - AI Photo Restoration

A modern web application that uses AI to restore and enhance old, damaged, or faded photos. Built with React + TypeScript frontend and Node.js + Express backend, powered by OpenRouter AI.

## ✨ Features

- **🤖 AI-Powered Restoration** - Advanced AI analysis and enhancement recommendations
- **🎯 Drag & Drop Upload** - Easy image uploading with drag and drop support
- **⚡ Real-time Processing** - Live status updates during image processing
- **📱 Responsive Design** - Works perfectly on desktop and mobile devices
- **🎨 Cyberpunk UI** - Modern neon-themed interface with smooth animations
- **🔒 Secure & Rate Limited** - Built-in security and API cost protection
- **🌍 International Ready** - Optimized for global usage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenRouter API key ([Get one here](https://openrouter.ai))

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd picture-repair-app

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit server/.env and add your OpenRouter API key
OPENROUTER_API_KEY=your_actual_api_key_here
```

### 3. Run the Application

```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend (in a new terminal)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🏗️ Project Structure

```
picture-repair-app/
├── src/                    # Frontend React app
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles (Tailwind)
├── server/                # Backend Node.js API
│   ├── server.js          # Express server
│   ├── package.json       # Backend dependencies
│   ├── .env.example       # Environment variables template
│   ├── uploads/           # Temporary uploaded images
│   └── processed/         # Processed images storage
├── public/                # Static assets
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration with API proxy
└── tailwind.config.js     # Tailwind CSS configuration
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Required |
| `PORT` | Backend server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `SITE_URL` | Your site URL for API headers | http://localhost:3001 |

### API Rate Limiting

- **Rate Limit**: 10 requests per 15 minutes per IP
- **File Size Limit**: 10MB per image
- **Supported Formats**: JPG, PNG, GIF, WebP

## 🌐 Deployment

### Frontend Deployment (Vercel/Netlify)

1. Build the frontend:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

3. Configure environment variables in your hosting dashboard

### Backend Deployment (Railway/Heroku/DigitalOcean)

1. Set environment variables:
```bash
OPENROUTER_API_KEY=your_key
NODE_ENV=production
SITE_URL=https://yourdomain.com
```

2. Update CORS origins in `server/server.js`:
```javascript
origin: ['https://yourdomain.com', 'https://www.yourdomain.com']
```

3. Deploy using your preferred platform

## 💰 Cost Management

The app includes several cost-control features:

- **Rate Limiting**: Prevents API abuse
- **Image Optimization**: Reduces API payload size
- **Error Handling**: Prevents unnecessary API calls
- **File Size Limits**: Controls processing costs

### Estimated Costs (OpenRouter)

- **Claude-3-Sonnet**: ~$0.003 per image analysis
- **Monthly Budget**: Set your own limits in OpenRouter dashboard

## 🛠️ Development

### Available Scripts

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend:**
```bash
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/repair-image` | Upload and process image |
| GET | `/api/processed/:filename` | Download processed image |
| GET | `/api/health` | Health check |
| GET | `/api/info` | API information |

## 🔍 Troubleshooting

### Common Issues

1. **"API Key not configured"**
   - Make sure `OPENROUTER_API_KEY` is set in `server/.env`

2. **"CORS Error"**
   - Check that the backend is running on port 3001
   - Verify Vite proxy configuration

3. **"File too large"**
   - Images must be under 10MB
   - Consider compressing large images

4. **"Rate limit exceeded"**
   - Wait 15 minutes or adjust rate limits in `server.js`

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages and stack traces.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) for AI API services
- [Anthropic Claude](https://www.anthropic.com) for image analysis
- [Lucide React](https://lucide.dev) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com) for styling

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation at `/api/info`

---

**Made with ❤️ for the global community**