import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Eraser, Upload, File, CheckCircle2 } from 'lucide-react';

export function Redact() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRedact = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 h-full flex flex-col">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-white shadow-sm">
          <Eraser className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Redact Information</h1>
          <p className="text-[#071747]/60 text-sm">Permanently remove sensitive text and graphics from your PDF.</p>
        </div>
      </div>

      {!file ? (
        <Card className="max-w-2xl mx-auto w-full mt-8">
          <div className="h-64 border-2 border-dashed border-[#DCE7FA] rounded-xl flex items-center justify-center bg-[#F3F7FF]/50 relative hover:border-[#075BE8] transition-colors cursor-pointer">
            <div className="flex flex-col items-center">
              <Upload className="w-10 h-10 text-[#075BE8] mb-3" />
              <span className="font-semibold text-lg text-[#071747]">Select PDF for Redaction</span>
              <span className="text-sm text-[#071747]/60 mt-1">Drag and drop or click to browse</span>
            </div>
            <input 
              type="file" 
              accept="application/pdf" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
          </div>
        </Card>
      ) : success ? (
        <Card className="max-w-2xl mx-auto w-full mt-8 text-center py-16 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#071747] mb-2">Redactions Applied</h3>
          <p className="text-[#071747]/60 mb-8 max-w-md mx-auto">
            Sensitive information has been permanently removed from the document. The original file remains untouched.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => { setFile(null); setSuccess(false); }}>Redact Another File</Button>
            <Button>Download Redacted PDF</Button>
          </div>
        </Card>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
          <Card className="lg:col-span-3 bg-gray-100 flex items-center justify-center border border-[#DCE7FA] overflow-hidden min-h-[500px]">
            <div className="text-center text-gray-500">
              <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Document preview loaded.</p>
              <p className="text-sm mt-2">Draw rectangles over text to redact.</p>
            </div>
          </Card>
          <Card className="lg:col-span-1 space-y-6 flex flex-col">
            <h3 className="font-bold text-[#071747] border-b border-[#DCE7FA] pb-3">Redaction Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#071747] mb-1.5">Redaction Fill Color</label>
                <div className="flex gap-2">
                  {['#000000', '#ffffff', '#ef4444', '#3b82f6'].map(color => (
                    <button key={color} className="w-8 h-8 rounded border border-gray-300 focus:ring-2 focus:ring-[#075BE8]" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#071747] mb-1.5">Overlay Text (Optional)</label>
                <input type="text" placeholder="e.g. REDACTED" className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] text-sm" />
              </div>
              
              <div className="pt-4 border-t border-[#DCE7FA]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-[#071747]">Remove all metadata</span>
                </label>
              </div>
            </div>

            <div className="pt-4 mt-auto border-t border-[#DCE7FA]">
              <Button fullWidth variant="danger" onClick={handleRedact} disabled={processing}>
                {processing ? 'Applying...' : 'Apply Redactions'}
              </Button>
              <p className="text-xs text-center text-red-500 mt-3 font-medium">Applied redactions cannot be undone.</p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500">
                Demo Mode: Server-side permanent redaction is mocked for preview.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}