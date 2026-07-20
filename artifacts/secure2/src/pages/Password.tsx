import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KeyRound, Upload, File, CheckCircle2 } from 'lucide-react';

export function Password() {
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'change' | 'remove'>('add');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleProcess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 1500);
  };

  const reset = () => {
    setFile(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#075BE8] flex items-center justify-center text-white shadow-sm">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Password Management</h1>
          <p className="text-[#071747]/60 text-sm">Add, change, or remove passwords from your PDF documents.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#DCE7FA]">
        {['add', 'change', 'remove'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-[#075BE8] text-[#075BE8]' : 'border-transparent text-[#071747]/60 hover:text-[#071747]'
            }`}
            onClick={() => { setActiveTab(tab as any); setSuccess(false); }}
          >
            {tab} Password
          </button>
        ))}
      </div>

      <Card className="max-w-2xl mx-auto space-y-6">
        {success ? (
          <div className="text-center py-10 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-[#075BE8] mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#071747]">Demo Preview Complete</h3>
            <p className="text-[#071747]/60 mt-2 mb-6">
              This is a simulated preview. In a production environment, the password would be {activeTab === 'add' ? 'added to' : activeTab === 'change' ? 'changed for' : 'removed from'} {file?.name}. No actual file was modified.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={reset}>Finish Demo</Button>
            </div>
          </div>
        ) : (
          <>
            {!file ? (
              <div className="h-48 border-2 border-dashed border-[#DCE7FA] rounded-xl flex items-center justify-center bg-[#F3F7FF]/50 relative hover:border-[#075BE8] transition-colors cursor-pointer">
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-[#075BE8] mb-2" />
                  <span className="font-medium text-[#071747]">Select PDF File</span>
                  <span className="text-xs text-[#071747]/60 mt-1">Drag and drop or click to browse</span>
                </div>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <File className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-[#071747] truncate flex-1">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            )}

            {file && (
              <div className="space-y-4 pt-4">
                {activeTab === 'change' || activeTab === 'remove' ? (
                  <div>
                    <label className="block text-sm font-semibold text-[#071747] mb-1.5">Current Password</label>
                    <input type="password" placeholder="Enter current password" className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8]" />
                  </div>
                ) : null}

                {activeTab === 'add' || activeTab === 'change' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-[#071747] mb-1.5">New Password</label>
                      <input type="password" placeholder="Enter new password" className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#071747] mb-1.5">Confirm New Password</label>
                      <input type="password" placeholder="Confirm new password" className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8]" />
                    </div>
                  </>
                ) : null}

                <Button 
                  fullWidth 
                  className="mt-4" 
                  variant={activeTab === 'remove' ? 'danger' : 'primary'}
                  onClick={handleProcess}
                  disabled={processing}
                >
                  {processing ? 'Processing (Demo)...' : activeTab === 'add' ? 'Apply Password (Demo)' : activeTab === 'change' ? 'Update Password (Demo)' : 'Remove Protection (Demo)'}
                </Button>
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 text-center">
                  Demo Mode: Real encryption requires backend or advanced WASM integration.
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}