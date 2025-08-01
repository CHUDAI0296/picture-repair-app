import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Image as ImageIcon, Sparkles, ArrowRight, Check, Loader2, Zap } from 'lucide-react';
import CompareImage from 'react-compare-image';

// 添加OpenRouter API相关接口
interface OpenRouterResponse {
  output: string;
  error?: string;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  processed?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  error?: string;
}

const sampleImages = [
  {
    before: '/samples/sample1_before.jpg',
    after: '/samples/sample1_after.jpg',
    title: 'Sample Restoration 1'
  },
  {
    before: '/samples/sample2_before.jpg',
    after: '/samples/sample2_after.jpg',
    title: 'Sample Restoration 2'
  },
  {
    before: '/samples/sample3_before.jpg',
    after: '/samples/sample3_after.jpg',
    title: 'Sample Restoration 3'
  }
];

function App() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  // 移除API密钥相关状态，因为现在使用后端API
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: UploadedImage = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: e.target?.result as string,
            status: 'uploaded'
          };
          setImages((prev: UploadedImage[]) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
    handleFiles(files);
    }
  };

  const processImage = async (id: string) => {
    setImages((prev: UploadedImage[]) => prev.map((img: UploadedImage) => 
      img.id === id ? { ...img, status: 'processing' } : img
    ));
    setIsProcessing(true);

    const image = images.find((img: UploadedImage) => img.id === id);
    if (!image) return;

    try {
      // 将图片转换为base64
      const base64Image = image.preview.split(',')[1];
      
      // 调用我们的Vercel API端点
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          prompt: 'Restore this photo, fix any damage, enhance colors, and improve quality.'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.statusText}, ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // 处理返回的数据
      if (data.success && data.data) {
        // 确保返回的数据是完整的base64图像URL
        const processedImageData = data.data.startsWith('data:') 
          ? data.data 
          : `data:image/jpeg;base64,${data.data}`;
        
        setImages((prev: UploadedImage[]) => prev.map((img: UploadedImage) => 
          img.id === id ? { 
            ...img, 
            status: 'completed',
            processed: processedImageData
          } : img
        ));
        
        // 如果有AI分析结果，可以在这里处理
        if (data.analysis) {
          console.log('AI Analysis:', data.analysis);
        }
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setImages((prev: UploadedImage[]) => prev.map((img: UploadedImage) => 
        img.id === id ? { 
          ...img, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : img
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (image: UploadedImage) => {
    console.log('Downloading image:', image);
    console.log('Processed data available:', !!image.processed);
    console.log('Processed data type:', typeof image.processed);
    
    const link = document.createElement('a');
    const imageData = image.processed || image.preview;
    link.href = imageData;
    link.download = `restored_${image.file.name}`;
    
    // 添加错误处理
    link.onerror = (e) => {
      console.error('Download error:', e);
      alert('Download failed. Please try again.');
    };
    
    link.click();
  };



  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 背景动画 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* 头部 */}
      <header className="relative z-50 bg-black/80 backdrop-blur-md border-b border-pink-500/30 shadow-lg shadow-pink-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/50">
                <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Picture Repair App
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-pink-400 transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">Features</a>
              <a href="#gallery" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Gallery</a>
              <a href="#pricing" className="text-gray-300 hover:text-purple-400 transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">Pricing</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Restore Your
            <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">
              Digital Memories
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform old, damaged, or faded photos into stunning high-quality images using advanced AI technology. 
            Bring your family memories back to life with cyberpunk precision.
          </p>

          {/* Upload Area */}
          <div className="max-w-4xl mx-auto">
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
                dragActive 
                  ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.3)]' 
                  : 'border-cyan-500/50 hover:border-pink-500/70 bg-black/30 hover:bg-pink-500/5 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)]'
              } backdrop-blur-sm`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/50 animate-pulse">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  Drop your photos here
                </h3>
                <p className="text-gray-400 mb-6">
                  or click to browse from your device
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Select Photos
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Your Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {images.map((image) => (
                <div key={image.id} className="bg-black/50 backdrop-blur-sm rounded-2xl border border-cyan-500/30 shadow-lg shadow-cyan-500/20 overflow-hidden hover:border-pink-500/50 hover:shadow-pink-500/30 transition-all duration-300">
                  <div className="aspect-square relative overflow-hidden">
                    <div className="flex h-full">
                      {/* Before Image */}
                      <div className="w-1/2 relative border-r border-cyan-500/30">
                        <img
                          src={image.preview}
                          alt="Before restoration"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-red-500/80 backdrop-blur-sm rounded text-xs font-medium text-white">
                          Before
                        </div>
                      </div>
                      
                      {/* After Image */}
                      <div className="w-1/2 relative">
                        <img
                          src={image.processed || image.preview}
                          alt="After restoration"
                          className={`w-full h-full object-cover transition-all duration-500 ${
                            image.status === 'completed' ? 'filter-none' : 'filter grayscale blur-sm'
                          }`}
                        />
                        <div className={`absolute bottom-2 right-2 px-2 py-1 backdrop-blur-sm rounded text-xs font-medium text-white ${
                          image.status === 'completed' ? 'bg-green-500/80' : 'bg-gray-500/80'
                        }`}>
                          After
                        </div>
                        
                        {/* Processing overlay */}
                        {image.status !== 'completed' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center text-white">
                              {image.status === 'processing' ? (
                                <>
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
                                  <p className="text-xs text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Processing...</p>
                                </>
                              ) : (
                                <p className="text-xs text-gray-400">Waiting to process</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Center divider line */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-pink-500 via-purple-500 to-cyan-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                    
                    {image.status === 'processing' && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-green-400/50">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-300 truncate">
                        {image.file.name}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        image.status === 'uploaded' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' :
                        image.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                        'bg-green-500/20 text-green-400 border-green-500/50'
                      }`}>
                        {image.status === 'uploaded' ? 'Ready' :
                         image.status === 'processing' ? 'Processing' : 'Completed'}
                      </span>
                    </div>
                    
                    <div className="flex space-x-3">
                      {image.status === 'uploaded' && (
                        <button
                          onClick={() => processImage(image.id)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Repair Photo
                        </button>
                      )}
                      
                      {image.status === 'completed' && (
                        <button
                          onClick={() => downloadImage(image)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add error handling */}
                  {image.status === 'error' && (
                    <div className="p-4 bg-red-500/20 border-t border-red-500/30 text-red-400 text-sm">
                      <p>Error: {image.error || 'Failed to process image'}</p>
                      <button
                        onClick={() => processImage(image.id)}
                        className="mt-2 px-3 py-1 bg-red-500/30 hover:bg-red-500/50 rounded text-white text-xs transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-black/30 backdrop-blur-sm border-y border-purple-500/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Powerful AI Photo Restoration
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our advanced artificial intelligence can repair and enhance photos with cyberpunk precision.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "AI-Powered Repair",
                description: "Advanced machine learning algorithms automatically detect and fix damage, scratches, and fading.",
                gradient: "from-pink-500 to-purple-500",
                shadow: "shadow-pink-500/50"
              },
              {
                icon: <ImageIcon className="w-8 h-8" />,
                title: "Color Restoration",
                description: "Bring faded colors back to life and enhance contrast for vibrant, true-to-life images.",
                gradient: "from-cyan-500 to-blue-500",
                shadow: "shadow-cyan-500/50"
              },
              {
                icon: <Download className="w-8 h-8" />,
                title: "High Quality Output",
                description: "Download your restored photos in high resolution, perfect for printing or digital sharing.",
                gradient: "from-purple-500 to-indigo-500",
                shadow: "shadow-purple-500/50"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg ${feature.shadow}`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold text-white mb-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{feature.title}</h4>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Gallery */}
      <section id="gallery" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Before & After Gallery
            </h3>
            <p className="text-xl text-gray-300">
              See the amazing transformations our AI can achieve
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sampleImages.map((img, idx) => (
              <div
                key={idx}
                className="bg-[#23293a] rounded-2xl shadow-lg p-6 flex flex-col items-center relative group border-2 border-transparent hover:border-pink-500 transition-all duration-300"
              >
                <div className="relative w-full h-64 flex items-center justify-center overflow-hidden mb-4">
                  {/* 悬停切换对比图 */}
                  <img
                    src={img.before}
                    alt="Damaged"
                    className="absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-500 group-hover:opacity-0"
                  />
                  <img
                    src={img.after}
                    alt="Restored"
                    className="absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  />
                </div>
                <div className="text-lg text-white font-semibold mb-2">{img.title}</div>
                <div className="flex justify-between w-full px-2">
                  <span className="text-gray-300">Damaged Photo</span>
                  <span className="text-pink-400 mx-2">→</span>
                  <span className="text-green-400">Restored</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/80 backdrop-blur-md border-t border-pink-500/30 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">Picture Repair App</h4>
          </div>
          <p className="text-gray-400 mb-6">
            Restore your precious memories with the power of AI
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">Contact</a>
          </div>
        </div>
      </footer>

      {/* 全局加载状态 */}
      {isProcessing && (
        <div className="fixed bottom-4 right-4 bg-black/70 backdrop-blur-md border border-pink-500/50 rounded-lg p-3 text-white flex items-center shadow-lg shadow-pink-500/20 z-50">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-pink-400" />
          <span>Processing image...</span>
        </div>
      )}
    </div>
  );
}

export default App;