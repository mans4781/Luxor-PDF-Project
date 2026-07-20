import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Upload, File, CheckCircle2 } from 'lucide-react';

export function Permissions() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [perms, setPerms] = useState({
    printing: true,
    highQuality: false,
    copying: false,
    editing: false,
    annotations: false,
    forms: false,
    assembly: false,
    extraction: true
  });

  const togglePerm = (key: keyof typeof perms) => {
    setPerms(p => ({ ...p, [key]: !p[key] }));
  };

  const handleApply = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 1500);
  };

  const permLabels = [
    { key: 'printing', label: 'Allow Printing' },
    { key: 'highQuality', label: 'Allow High Quality Printing' },
    { key: 'copying', label: 'Allow Copying' },
    { key: 'editing', label: 'Allow Editing' },
    { key: 'annotations', label: 'Allow Annotations' },
    { key: 'forms', label: 'Allow Form Filling' },
    { key: 'assembly', label: 'Allow Document Assembly' },
    { key: 'extraction', label: 'Allow Content Extraction' },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Document Permissions</h1>
          <p className="text-[#071747]/60 text-sm">Restrict printing, editing, and copying without full encryption.</p>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto space-y-6">
        {!file ? (
          <div className="h-32 border-2 border-dashed border-[#DCE7FA] rounded-xl flex items-center justify-center bg-[#F3F7FF]/50 relative hover:border-[#075BE8] transition-colors cursor-pointer">
            <div className="flex flex-col items-center">
              <Upload className="w-6 h-6 text-[#075BE8] mb-2" />
              <span className="font-medium text-[#071747]">Select PDF File</span>
            </div>
            <input 
              type="file" 
              accept="application/pdf" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-6">
            <File className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-[#071747] truncate flex-1">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline">Remove</button>
          </div>
        )}

        <div className={!file ? 'opacity-50 pointer-events-none' : ''}>
          {success ? (
            <div className="text-center py-8 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-[#075BE8] mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#071747]">Permissions Applied (Demo)</h3>
              <p className="text-[#071747]/60 mt-2 mb-6">
                This is a simulated preview. In a production build, these restrictions would be permanently written to the PDF.
              </p>
              <Button variant="outline" onClick={() => { setSuccess(false); setFile(null); }}>Finish Demo</Button>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-[#071747] mb-4">Permission Profile</h3>
              <select className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8] text-[#071747] mb-6">
                <option>Custom Settings</option>
                <option>Read Only</option>
                <option>Print Only</option>
                <option>Review & Comment</option>
              </select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#DCE7FA] pt-6">
                {permLabels.map(perm => (
                  <label key={perm.key} className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-[#F3F7FF] transition-colors">
                    <span className="text-sm text-[#071747] font-medium">{perm.label}</span>
                    <div className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${perms[perm.key] ? 'bg-[#075BE8]' : 'bg-slate-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${perms[perm.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={perms[perm.key]} onChange={() => togglePerm(perm.key)} />
                  </label>
                ))}
              </div>

              <div className="pt-8">
                <Button fullWidth size="lg" onClick={handleApply} disabled={processing}>
                  {processing ? 'Applying...' : 'Apply Permissions (Demo)'}
                </Button>
                <div className="mt-3 text-center text-xs font-medium text-slate-500">
                  Demo Mode: Simulating permission restrictions.
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}