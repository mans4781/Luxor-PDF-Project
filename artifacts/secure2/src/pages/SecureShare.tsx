import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Share2, Clock, CalendarIcon, File as FileIcon, Upload, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function SecureShare() {
  const { secureShares, addShare } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [generating, setGenerating] = useState(false);
  const [successLink, setSuccessLink] = useState('');

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const newShare = {
        id: Math.random().toString(36).substring(7),
        document: file?.name || 'Document.pdf',
        recipient: email,
        created: new Date().toISOString(),
        expires: new Date(`${expiryDate}T${expiryTime}`).toISOString(),
        views: 0,
        downloads: 0,
        status: 'Active' as const,
      };
      addShare(newShare);
      setSuccessLink(`https://luxor.app/share/${newShare.id}`);
      setGenerating(false);
    }, 1500);
  };

  const handleReset = () => {
    setFile(null);
    setEmail('');
    setExpiryDate('');
    setExpiryTime('');
    setSuccessLink('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#F59E0B] flex items-center justify-center text-white shadow-sm">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Secure Share</h1>
          <p className="text-[#071747]/60 text-sm">Create trackable, expirable links for confidential documents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Share Form */}
        <Card className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-[#071747] border-b border-[#DCE7FA] pb-3">Create Link</h2>
          
          {successLink ? (
            <div className="space-y-4 text-center py-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#071747]">Link Generated</h3>
              <p className="text-sm text-[#071747]/60">Your secure share link is ready.</p>
              
              <div className="p-3 bg-slate-50 border border-[#DCE7FA] rounded-lg break-all text-xs font-medium text-[#075BE8] select-all">
                {successLink}
              </div>
              
              <Button fullWidth variant="outline" onClick={handleReset} className="mt-4">
                Share Another File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!file ? (
                <div className="h-24 border-2 border-dashed border-[#DCE7FA] rounded-xl flex items-center justify-center bg-[#F3F7FF]/50 relative hover:border-[#075BE8] transition-colors cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Upload className="w-5 h-5 text-[#075BE8] mb-1" />
                    <span className="text-xs font-medium text-[#071747]/60">Select PDF to Share</span>
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
                  <FileIcon className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-[#071747] truncate flex-1">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#071747] mb-1.5">Recipient Email</label>
                <input
                  type="email"
                  className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8] text-[#071747]"
                  placeholder="investor@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#071747] mb-1.5 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" /> Expiry Date
                  </label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8] text-[#071747]"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071747] mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Expiry Time
                  </label>
                  <input
                    type="time"
                    className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#075BE8] text-[#071747]"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-[#075BE8] focus:ring-[#075BE8]" defaultChecked />
                  <span className="text-sm text-[#071747]">Disable Printing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-[#075BE8] focus:ring-[#075BE8]" defaultChecked />
                  <span className="text-sm text-[#071747]">Disable Downloading</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-[#075BE8] focus:ring-[#075BE8]" />
                  <span className="text-sm text-[#071747]">Add Watermark</span>
                </label>
              </div>

              <Button 
                fullWidth 
                className="mt-4" 
                disabled={!file || !email || !expiryDate || generating}
                onClick={handleGenerate}
              >
                {generating ? 'Generating...' : 'Generate Secure Link'}
              </Button>
            </div>
          )}
        </Card>

        {/* Active Shares Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-[#071747]">Active & Past Shares</h2>
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE7FA] bg-[#F3F7FF]/50 text-[#071747]/60 text-sm">
                    <th className="px-5 py-3 font-medium">Document</th>
                    <th className="px-5 py-3 font-medium">Recipient</th>
                    <th className="px-5 py-3 font-medium">Expires</th>
                    <th className="px-5 py-3 font-medium">Views</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#071747]">
                  {secureShares.map((share) => {
                    const derivedStatus = new Date(share.expires) > new Date() ? 'Active' : 'Expired';
                    return (
                    <tr key={share.id} className="border-b border-[#DCE7FA] last:border-0 hover:bg-[#F3F7FF] transition-colors">
                      <td className="px-5 py-4 font-medium max-w-[150px] truncate" title={share.document}>
                        {share.document}
                      </td>
                      <td className="px-5 py-4 text-[#071747]/60 truncate max-w-[150px]" title={share.recipient}>
                        {share.recipient}
                      </td>
                      <td className="px-5 py-4 font-medium text-[#071747]">
                        {new Date(share.expires).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-4 text-[#071747]/60">{share.views}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          derivedStatus === 'Active' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {derivedStatus}
                        </span>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}