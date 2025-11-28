import React, { useState } from 'react';
import { AppView, GenerationBatch } from './types';
import { ImageGenerator } from './components/ImageGenerator';
import { Billing } from './components/Billing';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CREATE);
  const [credits, setCredits] = useState(150);
  const [history, setHistory] = useState<GenerationBatch[]>([]);

  // Function to add new generation results to history
  const handleGenerationComplete = (batch: GenerationBatch) => {
    setHistory(prev => [batch, ...prev]);
    setCredits(prev => Math.max(0, prev - (batch.images.length * 2))); // Deduct credits
  };

  const NavItem = ({ view, icon, label }: { view: AppView; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        currentView === view
          ? 'bg-primary/10 text-primary border border-primary/10'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className={`${currentView === view ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`}>
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
      {view === AppView.GALLERY && history.length > 0 && (
         <span className="ml-auto bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full">{history.length}</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans selection:bg-primary/30">
      {/* Mobile Header */}
      <div className="lg:hidden h-16 border-b border-border flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">L</div>
            <span className="font-bold text-lg tracking-tight">Lumina</span>
         </div>
         <button className="text-gray-400 hover:text-white" onClick={() => setCurrentView(AppView.GALLERY)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
         </button>
      </div>

      <div className="flex h-[calc(100vh-64px)] lg:h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 border-r border-border bg-surface/50 backdrop-blur-xl flex-col p-6 z-30">
          <div className="flex items-center px-2 mb-10">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-primary/20 text-xl">L</div>
             <span className="font-bold text-xl tracking-tight text-white">Lumina</span>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem 
              view={AppView.CREATE} 
              label="Workbench" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} 
            />
            <NavItem 
              view={AppView.GALLERY} 
              label="Gallery" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} 
            />
            <NavItem 
              view={AppView.BILLING} 
              label="Billing & Plans" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} 
            />
            <NavItem 
              view={AppView.SETTINGS} 
              label="Settings" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
            />
          </nav>

          <div className="pt-6 mt-6 border-t border-border">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Credits Balance</span>
                    <span className="text-xs font-bold text-white font-mono">{credits}</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-indigo-500 h-1.5 rounded-full" style={{ width: `${(credits / 1000) * 100}%` }}></div>
                </div>
                <button 
                  onClick={() => setCurrentView(AppView.BILLING)}
                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold rounded-lg transition-colors"
                >
                    Upgrade Plan
                </button>
            </div>
            <div className="flex items-center mt-6 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-500 to-gray-700 p-[1px]">
                  <img src="https://picsum.photos/seed/user/200" className="w-full h-full rounded-full border-2 border-surface" alt="Avatar" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-bold text-white">Pro User</p>
                    <p className="text-xs text-gray-500">team@lumina.ai</p>
                </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background relative custom-scrollbar">
          
          {currentView === AppView.CREATE && (
            <ImageGenerator onGenerateComplete={handleGenerationComplete} />
          )}

          {currentView === AppView.BILLING && <Billing />}

          {currentView === AppView.GALLERY && (
            <div className="p-8 lg:p-12 min-h-full">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Your Gallery</h2>
                        <p className="text-gray-400">View and manage your generated assets across all sessions.</p>
                    </div>
                    {history.length > 0 && (
                        <button className="text-sm text-gray-400 hover:text-white transition-colors">Export All</button>
                    )}
                </div>
                
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl bg-surface/20">
                        <div className="w-16 h-16 rounded-full bg-surface border border-white/5 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No generations yet</h3>
                        <p className="text-gray-500 max-w-sm text-center mb-8">Go to the workbench to start creating stunning visuals with Gemini.</p>
                        <button 
                          onClick={() => setCurrentView(AppView.CREATE)} 
                          className="px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                        >
                            Start Creating
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {history.flatMap(batch => batch.images).map((image) => (
                            <div key={image.id} className="group relative aspect-square rounded-xl overflow-hidden bg-surface border border-white/5">
                                <img 
                                    src={image.url} 
                                    loading="lazy" 
                                    alt="Generated" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <p className="text-xs text-gray-300 line-clamp-2 mb-3">{image.prompt}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300">{image.aspectRatio}</span>
                                        <a 
                                          href={image.url} 
                                          download={`lumina-${image.id}.png`}
                                          className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
                                        >
                                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
           {currentView === AppView.SETTINGS && (
            <div className="p-10">
                <h2 className="text-2xl font-bold text-gray-200 mb-6">Settings</h2>
                <div className="bg-surface/50 border border-border rounded-xl p-8 max-w-3xl backdrop-blur-sm">
                    <h3 className="text-lg font-medium text-white mb-4">API Configuration</h3>
                    <p className="text-gray-400 text-sm mb-6">Lumina uses Google Gemini 2.5 Flash for high-speed generation and multimodal analysis.</p>
                    
                    <div className="grid gap-4">
                         <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                            <div>
                                <h4 className="text-sm font-medium text-white">System Status</h4>
                                <p className="text-xs text-gray-500">Google Gemini API</p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                <span className="font-semibold">Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;