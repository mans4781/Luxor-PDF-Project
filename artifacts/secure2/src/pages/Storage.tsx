import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { HardDrive, Folder, File, Search, Filter, MoreVertical, Download, Share2, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Storage() {
  const { recentFiles, deleteFile } = useAppStore();
  
  const folders = [
    { name: 'Secured PDFs', count: 145, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Shared PDFs', count: 56, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Batch Outputs', count: 89, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Redacted PDFs', count: 34, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#071747] flex items-center justify-center text-white shadow-sm">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Storage</h1>
          <p className="text-[#071747]/60 text-sm">Manage your secured and shared documents.</p>
        </div>
      </div>

      {/* Storage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#071747]">Storage Used</span>
            <span className="text-sm text-[#075BE8] font-bold">42%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#075BE8]" style={{ width: '42%' }} />
          </div>
          <div className="mt-2 text-xs text-[#071747]/60">4.2 GB of 10 GB total</div>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-[#071747]">1,248</div>
            <div className="text-sm text-[#071747]/60 font-medium">Total Files</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#075BE8]">
            <File className="w-6 h-6" />
          </div>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-[#071747]">156</div>
            <div className="text-sm text-[#071747]/60 font-medium">Active Shares</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Share2 className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Folders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {folders.map(folder => (
          <Card key={folder.name} className="p-4 cursor-pointer hover:border-[#0878FF] hover:shadow-md transition-all group flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${folder.bg}`}>
              <Folder className={`w-5 h-5 ${folder.color}`} />
            </div>
            <div>
              <div className="font-semibold text-[#071747]">{folder.name}</div>
              <div className="text-xs text-[#071747]/60">{folder.count} files</div>
            </div>
          </Card>
        ))}
      </div>

      {/* File Manager */}
      <Card noPadding className="flex flex-col h-[500px]">
        <div className="p-4 border-b border-[#DCE7FA] flex items-center justify-between bg-slate-50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input type="text" placeholder="Search files..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#075BE8] focus:outline-none" />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {}}><Filter className="w-4 h-4" /> Filter</Button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE7FA] bg-white sticky top-0 z-10 text-[#071747]/60 text-sm">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium">Modified</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#071747]">
              {recentFiles.map(file => (
                <tr key={file.id} className="border-b border-[#DCE7FA] last:border-0 hover:bg-[#F3F7FF] transition-colors group">
                  <td className="px-5 py-4 font-medium flex items-center gap-3">
                    <File className="w-4 h-4 text-[#075BE8]" />
                    {file.name}
                  </td>
                  <td className="px-5 py-4 text-[#071747]/60">{(file.size / 1000000).toFixed(1)} MB</td>
                  <td className="px-5 py-4 text-[#071747]/60">{new Date(file.lastModified).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{file.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-500 hover:text-[#075BE8] rounded hover:bg-slate-100" title="Download (Demo)"><Download className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-500 hover:text-[#075BE8] rounded hover:bg-slate-100" title="Share" onClick={() => {}}><Share2 className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-500 hover:text-red-500 rounded hover:bg-red-50" title="Delete" onClick={() => deleteFile(file.id)}><Trash2 className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-500 hover:text-[#075BE8] rounded hover:bg-slate-100"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}