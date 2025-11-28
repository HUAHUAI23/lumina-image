import React, { useState } from 'react';

// Mock Data for Charts
const RECHARGE_DATA = [20, 45, 30, 80, 50, 90, 120];
const CONSUMPTION_DATA = [10, 25, 40, 35, 60, 55, 100];

const SimpleLineChart: React.FC<{ data: number[], color: string, label: string }> = ({ data, color, label }) => {
  const max = Math.max(...data);
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 100 - (val / max) * 80; // keep some padding
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-48 bg-white/5 rounded-xl p-4 border border-white/5 relative overflow-hidden">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{label}</h4>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
         {/* Grid lines */}
         <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
         <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
         <line x1="0" y1="80" x2="100" y2="80" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
         
         {/* Line */}
         <polyline 
            points={points} 
            fill="none" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            vectorEffect="non-scaling-stroke"
         />
         {/* Area (optional, tricky with simple polyline, skipping for clean look) */}
      </svg>
    </div>
  );
};

export const Billing: React.FC = () => {
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const presets = [10, 50, 100];

  const handlePresetSelect = (val: number) => {
    setSelectedPreset(val);
    setAmount(val);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSelectedPreset(null);
    if (isNaN(val)) setAmount('');
    else setAmount(val);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white animate-fade-in pb-20">
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-2">Billing & Recharge</h2>
        <p className="text-gray-400">Manage your credits with our flexible pay-as-you-go system.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recharge */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-surface to-background border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Current Balance</p>
                        <h3 className="text-5xl font-bold tracking-tight text-white">$24.50</h3>
                        <p className="text-xs text-gray-500 mt-2">≈ 2,450 Credits remaining</p>
                    </div>
                    <button className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                        Auto-Recharge Off
                    </button>
                </div>
            </div>

            {/* Recharge Section */}
            <div className="bg-surface/50 border border-border rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-6">Add Funds</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {presets.map((val) => (
                        <button
                            key={val}
                            onClick={() => handlePresetSelect(val)}
                            className={`py-4 rounded-xl border text-center transition-all ${
                                selectedPreset === val 
                                ? 'bg-primary/20 border-primary text-primary' 
                                : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            <span className="block text-2xl font-bold">${val}</span>
                            <span className="text-xs opacity-60">+{val * 100} Credits</span>
                        </button>
                    ))}
                </div>

                <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Or Custom Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input 
                            type="number" 
                            min="1"
                            value={amount}
                            onChange={handleCustomChange}
                            placeholder="Enter amount..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                </div>

                <button 
                    disabled={!amount}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        amount 
                        ? 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20' 
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    Pay ${amount || '0.00'}
                </button>
                <p className="text-center text-xs text-gray-500 mt-4">Secured by Stripe. 1 Credit = $0.01</p>
            </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-200">Analytics</h3>
            
            <SimpleLineChart 
                data={RECHARGE_DATA} 
                color="#6366f1" 
                label="Recharge Analysis (Last 7 Days)" 
            />
            
            <SimpleLineChart 
                data={CONSUMPTION_DATA} 
                color="#f43f5e" 
                label="Consumption Trend" 
            />

            <div className="bg-surface/30 border border-border rounded-xl p-6">
                <h4 className="text-sm font-medium text-white mb-4">Recent Transactions</h4>
                <div className="space-y-4">
                    {[1,2,3].map((_, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                </div>
                                <div>
                                    <p className="text-gray-200">Top-up</p>
                                    <p className="text-xs text-gray-500">Oct {24 - i}, 2023</p>
                                </div>
                            </div>
                            <span className="font-mono text-emerald-400">+$50.00</span>
                        </div>
                    ))}
                     <div className="flex justify-between items-center text-sm opacity-50">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <p className="text-gray-200">Generation</p>
                                <p className="text-xs text-gray-500">Oct 20, 2023</p>
                            </div>
                        </div>
                        <span className="font-mono text-gray-400">-120 Credits</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};