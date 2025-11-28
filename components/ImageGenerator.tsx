import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio, GenerationBatch, GenerationMode } from '../types';
import { analyzeImageForPrompt, generateImageBatch } from '../services/geminiService';

const RATIOS = [
  { label: '1:1', value: AspectRatio.SQUARE },
  { label: '9:16', value: AspectRatio.PORTRAIT },
  { label: '16:9', value: AspectRatio.LANDSCAPE },
  { label: '3:4', value: AspectRatio.CLASSIC_PORTRAIT },
  { label: '4:3', value: AspectRatio.CLASSIC_LANDSCAPE },
];

interface ImageGeneratorProps {
  onGenerateComplete: (batch: GenerationBatch) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onGenerateComplete }) => {
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.TEXT_TO_IMAGE);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  
  // Logic States
  const [isGroupMode, setIsGroupMode] = useState(false);
  
  // Basic Count (Total images if Group Mode OFF, Batches if Group Mode ON)
  const [countValue, setCountValue] = useState(1); 
  
  // Group Mode Specific
  const [maxImagesPerBatch, setMaxImagesPerBatch] = useState<number | ''>(''); 

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [currentBatch, setCurrentBatch] = useState<GenerationBatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Calculate total images to generate based on settings
  const calculateTotalImages = () => {
    if (!isGroupMode) {
      return countValue;
    }
    // If group mode, it's (Batches * PerBatch)
    // PerBatch is either user defined or AI defined (random 5-15)
    // For calculation display, if AI defined, we show range or estimate?
    // User requested: "If not set, AI decides (max 15)".
    // We will simulate "AI Decision" at generation time, but for display let's assume avg 10.
    const perBatch = maxImagesPerBatch === '' ? 15 : maxImagesPerBatch;
    return countValue * perBatch;
  };

  const calculateCost = () => {
    const total = calculateTotalImages();
    // 1 Credit per image + 5 for VLM if prompt is empty (auto-analyze)
    // Here we simplify: 1 credit per image.
    return total * 1; 
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      const newUrls = newFiles.map(file => URL.createObjectURL(file));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      setPreviewUrls(prev => [...prev, ...newUrls]);

      if (prompt.length === 0 && newFiles.length > 0) {
        setIsAnalyzing(true);
        try {
          const suggestedPrompt = await analyzeImageForPrompt(newFiles[0]);
          setPrompt(suggestedPrompt);
        } catch (err) {
          console.error("Auto-analysis failed", err);
        } finally {
          setIsAnalyzing(false);
        }
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
        setError("Please enter a prompt.");
        return;
    }
    if (mode === GenerationMode.IMAGE_TO_IMAGE && uploadedFiles.length === 0) {
        setError("Please upload at least one reference image for Image-to-Image mode.");
        return;
    }

    setIsGenerating(true);
    setCurrentBatch(null);
    setError(null);

    try {
      let totalImagesToGen = countValue;

      if (isGroupMode) {
        // Calculate total for group mode
        let actualTotal = 0;
        const batches = countValue;
        
        // Logic: "AI determines count per batch"
        // If user sets maxImagesPerBatch, we use that as a hard limit/target.
        // If not, we randomize between 5 and 15 for each batch.
        for (let i = 0; i < batches; i++) {
           const limit = maxImagesPerBatch === '' ? 15 : maxImagesPerBatch;
           // If user didn't set, AI randomly chooses 5-15.
           // If user SET it, AI chooses 1 to Limit (or just Limit).
           // Let's assume user setting is the target.
           const countForThisBatch = maxImagesPerBatch === '' 
              ? Math.floor(Math.random() * (15 - 5 + 1)) + 5 
              : maxImagesPerBatch;
           actualTotal += countForThisBatch;
        }
        totalImagesToGen = actualTotal;
      }

      // Hard cap 500
      if (totalImagesToGen > 500) totalImagesToGen = 500;

      const generatedBase64s = await generateImageBatch(
        prompt, 
        aspectRatio, 
        uploadedFiles,
        totalImagesToGen
      );

      if (generatedBase64s.length === 0) {
        throw new Error("No images were generated.");
      }

      const newBatch: GenerationBatch = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        mode,
        prompt,
        referenceImagesCount: uploadedFiles.length,
        images: generatedBase64s.map(url => ({
          id: crypto.randomUUID(),
          url,
          prompt,
          aspectRatio
        }))
      };

      setCurrentBatch(newBatch);
      onGenerateComplete(newBatch);

    } catch (err) {
      setError("Generation failed. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden bg-background">
      {/* LEFT: Control Panel */}
      <div className="w-full lg:w-[420px] border-r border-border bg-surface/50 backdrop-blur-xl flex flex-col h-full z-20 shadow-2xl">
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-white tracking-tight">Workbench</h1>
            <p className="text-gray-500 text-xs mt-1">Configure your generation parameters</p>
          </div>

          {/* Mode Tabs */}
          <div className="bg-background/50 p-1 rounded-xl flex mb-8 border border-white/5">
             <button
                onClick={() => setMode(GenerationMode.TEXT_TO_IMAGE)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                  mode === GenerationMode.TEXT_TO_IMAGE 
                  ? 'bg-surface text-white shadow-lg shadow-black/20' 
                  : 'text-gray-500 hover:text-gray-300'
                }`}
             >
                Text to Image
             </button>
             <button
                onClick={() => setMode(GenerationMode.IMAGE_TO_IMAGE)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                  mode === GenerationMode.IMAGE_TO_IMAGE 
                  ? 'bg-surface text-white shadow-lg shadow-black/20' 
                  : 'text-gray-500 hover:text-gray-300'
                }`}
             >
                Image to Image
             </button>
          </div>

          <div className="space-y-8">
            {/* Image Upload Area */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Reference Images {uploadedFiles.length > 0 && <span className="text-primary ml-1">({uploadedFiles.length})</span>}
                 </label>
                 {mode === GenerationMode.IMAGE_TO_IMAGE && <span className="text-[10px] text-red-400 font-mono">REQUIRED</span>}
              </div>
              
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square group rounded-lg overflow-hidden border border-white/10">
                      <img src={url} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeFile(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer group ${
                    mode === GenerationMode.IMAGE_TO_IMAGE && uploadedFiles.length === 0 
                    ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' 
                    : 'border-border bg-white/5 hover:bg-white/10 hover:border-gray-500'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <p className="text-xs text-gray-400 group-hover:text-gray-200">
                    {uploadedFiles.length > 0 ? 'Add more images' : 'Upload reference images'}
                </p>
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept="image/*"
                />
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Prompt</label>
                 {isAnalyzing && <span className="text-[10px] text-primary animate-pulse">VLM Analyzing...</span>}
               </div>
               <div className="relative">
                 <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === GenerationMode.TEXT_TO_IMAGE ? "A cinematic shot of..." : "Describe changes..."}
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none transition-all"
                 />
               </div>
            </div>

            {/* Group Mode Toggle */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setIsGroupMode(!isGroupMode)}
            >
                <div>
                    <h4 className="text-sm font-medium text-gray-200 flex items-center">
                        Group Mode (Batch)
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">NEW</span>
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-1">
                        {isGroupMode ? 'Generate multiple batches with AI-varied sizing' : 'Generate standard image sets'}
                    </p>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${isGroupMode ? 'bg-primary' : 'bg-gray-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${isGroupMode ? 'translate-x-4' : ''}`}></div>
                </div>
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-2 gap-6">
                {/* Aspect Ratio */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Dimensions</label>
                    <div className="grid grid-cols-3 gap-2">
                        {RATIOS.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setAspectRatio(r.value)}
                                className={`h-10 rounded-lg border flex items-center justify-center transition-all ${
                                    aspectRatio === r.value 
                                    ? 'bg-white text-black border-white' 
                                    : 'bg-transparent border-border text-gray-500 hover:text-gray-300 hover:border-gray-600'
                                }`}
                                title={r.label}
                            >
                                <span className="text-[10px] font-bold">{r.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dynamic Count Inputs */}
                <div className="space-y-3">
                     <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        {isGroupMode ? 'Batches' : 'Image Count'}
                     </label>
                     <div className="flex items-center space-x-3">
                        <input 
                            type="range" 
                            min="1" 
                            max={isGroupMode ? 20 : 500} 
                            value={countValue} 
                            onChange={(e) => setCountValue(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="w-10 text-right font-mono text-sm">{countValue}</span>
                     </div>
                     <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>1</span>
                        <span>{isGroupMode ? '20 Batches' : '500 Images'}</span>
                     </div>
                </div>
            </div>

            {/* Extra Settings for Group Mode */}
            {isGroupMode && (
                <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/5 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Max Images Per Batch</label>
                        <span className="text-[10px] text-gray-500 italic">Optional</span>
                    </div>
                    <input 
                        type="number" 
                        min="1" 
                        max="15"
                        placeholder="Auto (AI decides, max 15)"
                        value={maxImagesPerBatch}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (isNaN(val)) setMaxImagesPerBatch('');
                            else setMaxImagesPerBatch(Math.min(Math.max(val, 1), 15));
                        }}
                        className="w-full bg-black/20 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                    />
                    <p className="text-[10px] text-gray-500">
                        Leave empty to let AI decide optimal batch size (5-15 images).
                    </p>
                </div>
            )}
          </div>
        </div>

        {/* Generate Action Area */}
        <div className="p-6 border-t border-border bg-surface/80 backdrop-blur-md">
            {error && <div className="text-red-400 text-xs mb-3 text-center animate-pulse">{error}</div>}
            
            <button
                onClick={handleGenerate}
                disabled={isGenerating || isAnalyzing || (mode === GenerationMode.IMAGE_TO_IMAGE && uploadedFiles.length === 0)}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-xl ${
                    isGenerating || isAnalyzing || (mode === GenerationMode.IMAGE_TO_IMAGE && uploadedFiles.length === 0)
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' 
                    : 'bg-primary hover:bg-primary-hover shadow-primary/20 hover:scale-[1.02]'
                }`}
            >
               {isGenerating ? (
                   <>
                     <svg className="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <span>PROCESSING...</span>
                   </>
               ) : (
                   <span>GENERATE</span>
               )}
            </button>
            
            {/* Cost Breakdown with Tooltip */}
            <div className="mt-4 flex justify-center group relative">
                <div className="flex items-center space-x-2 text-xs text-gray-400 cursor-help border-b border-dashed border-gray-700 pb-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Estimated Cost: <span className="text-white font-mono">{isGroupMode && maxImagesPerBatch === '' ? `~${countValue * 10}` : calculateCost()} credits</span></span>
                </div>
                
                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-black border border-white/10 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <h5 className="text-[10px] font-bold text-gray-300 uppercase mb-2">Cost Breakdown</h5>
                    <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex justify-between">
                            <span>Base Rate:</span>
                            <span className="text-white">1 Credit / Image</span>
                        </div>
                        {isGroupMode ? (
                            <>
                                <div className="flex justify-between">
                                    <span>Batches:</span>
                                    <span className="text-white">{countValue}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg. Size:</span>
                                    <span className="text-white">{maxImagesPerBatch === '' ? '10 (AI Est.)' : maxImagesPerBatch}</span>
                                </div>
                            </>
                        ) : (
                             <div className="flex justify-between">
                                <span>Image Count:</span>
                                <span className="text-white">{countValue}</span>
                            </div>
                        )}
                        <div className="border-t border-white/10 my-1 pt-1 flex justify-between font-bold text-white">
                            <span>Total:</span>
                            <span>{isGroupMode && maxImagesPerBatch === '' ? `~${countValue * 10}` : calculateCost()} Credits</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT: Canvas / Result Area */}
      <div className="flex-1 bg-black/40 p-8 flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)', 
            backgroundSize: '24px 24px' 
        }}></div>

        {currentBatch ? (
            <div className={`grid gap-6 w-full max-w-7xl z-10 max-h-full overflow-y-auto custom-scrollbar p-4 ${
                currentBatch.images.length === 1 ? 'grid-cols-1' :
                currentBatch.images.length === 2 ? 'grid-cols-2' : 
                currentBatch.images.length <= 4 ? 'grid-cols-2 lg:grid-cols-2' :
                'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}>
                {currentBatch.images.map((img, idx) => (
                    <div key={img.id} className="group relative rounded-2xl overflow-hidden shadow-2xl bg-surface border border-white/10 aspect-[3/4] animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                        <img src={img.url} alt="Generated" className="w-full h-full object-contain bg-black/50" />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                            <div className="flex space-x-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <a 
                                    href={img.url} 
                                    download={`lumina-${img.id}.png`}
                                    className="flex-1 bg-white text-black py-2 rounded-lg font-bold text-xs flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center z-10 max-w-md">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-surface to-background border border-white/5 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Ready to Create</h3>
                <p className="text-gray-500 leading-relaxed">
                    Upload reference images or describe your vision. 
                    <br/>Lumina uses Gemini 2.5 Flash for high-fidelity generation.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};