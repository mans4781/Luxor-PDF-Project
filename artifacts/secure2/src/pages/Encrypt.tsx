import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Lock, Eye, EyeOff, ShieldAlert, ShieldCheck, Upload, File, X, Replace } from 'lucide-react';

export function Encrypt() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState('AES-256');
  const [pwd, setPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mock permissions toggles
  const [permissions, setPermissions] = useState({
    print: false, edit: false, copy: false, annotate: false
  });

  const pwdMatch = pwd && confirmPwd && pwd === confirmPwd;
  const pwdStrength = pwd.length > 8 ? 'strong' : pwd.length > 4 ? 'medium' : 'weak';

  const handleProcess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#075BE8] flex items-center justify-center text-white shadow-sm">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Encrypt PDF</h1>
          <p className="text-[#071747]/60 text-sm">Secure your document with military-grade encryption.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          <Card className="space-y-6">
            <h2 className="text-lg font-bold text-[#071747] border-b border-[#DCE7FA] pb-4">Security Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#071747] mb-1.5">Encryption Level</label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8] focus:border-transparent text-[#071747]"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="AES-256">AES-256 – Highest Protection</option>
                  <option value="AES-128">AES-128 – Strong Protection</option>
                  <option value="Standard">Standard PDF Encryption</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#071747] mb-1.5">User Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="w-full h-10 pl-3 pr-10 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8] focus:border-transparent text-[#071747]"
                    placeholder="Enter password..."
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-[#071747]/40 hover:text-[#075BE8]">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {pwd && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className={`h-full ${pwdStrength === 'strong' ? 'w-full bg-green-500' : pwdStrength === 'medium' ? 'w-2/3 bg-yellow-500' : 'w-1/3 bg-red-500'}`} />
                    </div>
                    <span className="text-xs font-medium text-[#071747]/60 capitalize">{pwdStrength}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#071747] mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`w-full h-10 pl-3 pr-10 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:border-transparent text-[#071747] ${
                      confirmPwd ? (pwdMatch ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500') : 'border-[#DCE7FA] focus:ring-[#075BE8]'
                    }`}
                    placeholder="Confirm password..."
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                  />
                </div>
                {confirmPwd && !pwdMatch && <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match.</p>}
              </div>

              <div className="pt-4 border-t border-[#DCE7FA]">
                <label className="block text-sm font-semibold text-[#071747] mb-3">Permission Options (Custom)</label>
                <div className="space-y-3">
                  {[
                    { key: 'print', label: 'Allow Printing' },
                    { key: 'edit', label: 'Allow Editing' },
                    { key: 'copy', label: 'Allow Copying' },
                    { key: 'annotate', label: 'Allow Annotations' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-[#071747]">{perm.label}</span>
                      <div className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${permissions[perm.key as keyof typeof permissions] ? 'bg-[#075BE8]' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${permissions[perm.key as keyof typeof permissions] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={permissions[perm.key as keyof typeof permissions]} 
                        onChange={() => setPermissions(p => ({ ...p, [perm.key]: !p[perm.key as keyof typeof p] }))} 
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: File & Status */}
        <div className="space-y-6">
          <Card className="flex flex-col items-center justify-center p-8 border-dashed border-2 border-[#DCE7FA] bg-[#F3F7FF]/50 relative group min-h-[220px]">
            {!file ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#DCE7FA] text-[#075BE8]">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-[#071747] text-lg">Select a PDF file</h3>
                <p className="text-sm text-[#071747]/60 mt-1">Drag and drop or click to browse</p>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#DCE7FA] shadow-sm">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#071747] truncate">{file.name}</h4>
                    <p className="text-xs text-[#071747]/60">{(file.size / 1024 / 1024).toFixed(2)} MB • Unsecured</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFile(null)} className="p-2 hover:bg-slate-100 rounded-md text-[#071747]/60 transition-colors" title="Replace">
                      <Replace className="w-4 h-4" />
                    </button>
                    <button onClick={() => setFile(null)} className="p-2 hover:bg-red-50 rounded-md text-red-500 transition-colors" title="Remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-[#071747] text-white border-none shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              {pwdMatch && pwdStrength === 'strong' ? (
                <ShieldCheck className="w-6 h-6 text-green-400" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-yellow-400" />
              )}
              <h3 className="font-bold text-lg">Security Status</h3>
            </div>
            
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex justify-between items-center">
                <span>Encryption</span>
                <span className="font-medium text-white">{level}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Password</span>
                <span className="font-medium text-white">{pwd ? (pwdMatch ? 'Set (Valid)' : 'Mismatch') : 'Not Set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Permissions</span>
                <span className="font-medium text-white">Custom Restricted</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white/10 rounded-lg text-xs font-medium text-blue-200">
              Demo Mode: Server-side AES-256 encryption is mocked for preview.
            </div>
          </Card>

          {success ? (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="font-bold">Demo Preview Complete</h4>
                  <p className="text-sm opacity-80">In a production environment, this would produce a real AES-256 encrypted file. No actual file was modified.</p>
                </div>
              </div>
              <Button fullWidth onClick={() => { setSuccess(false); setFile(null); setPwd(''); setConfirmPwd(''); }}>Finish Demo</Button>
            </div>
          ) : processing ? (
            <Card className="text-center p-6 bg-blue-50 border-blue-200">
              <div className="w-8 h-8 border-4 border-[#075BE8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h4 className="font-bold text-[#071747]">Encrypting document (Demo)...</h4>
              <div className="w-full h-2 bg-blue-200 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-[#075BE8] animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
              </div>
            </Card>
          ) : (
            <Button 
              fullWidth 
              size="lg" 
              className="text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              disabled={!file || !pwd || !pwdMatch}
              onClick={handleProcess}
            >
              <Lock className="w-5 h-5 mr-2" /> Encrypt & Save (Demo)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}