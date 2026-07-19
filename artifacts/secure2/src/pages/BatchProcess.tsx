import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Layers, File, Play, FolderPlus, FilePlus, Download, Trash2, Settings, AlertCircle } from 'lucide-react';

export function BatchProcess() {
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [jobs, setJobs] = useState([
    { id: '1', name: 'Q1_Invoices_Batch.pdf', size: '1.2 MB', pages: 12, action: 'Encrypt (AES-256)', status: 'Waiting', progress: 0 },
    { id: '2', name: 'Employee_Handbooks.pdf', size: '4.5 MB', pages: 48, action: 'Add Watermark', status: 'Waiting', progress: 0 },
    { id: '3', name: 'Confidential_Memos.pdf', size: '0.8 MB', pages: 5, action: 'Remove Metadata', status: 'Waiting', progress: 0 },
  ]);

  const handleStartDemo = () => {
    setIsDemoRunning(true);
    setJobs(prev => prev.map(j => ({ ...j, status: 'Processing', progress: 20 })));
    
    setTimeout(() => {
      setJobs(prev => prev.map(j => ({ ...j, progress: 60 })));
      setTimeout(() => {
        setJobs(prev => prev.map(j => ({ ...j, status: 'Completed (Demo)', progress: 100 })));
        setIsDemoRunning(false);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Batch Process</h1>
          <p className="text-[#071747]/60 text-sm">Automate security operations across multiple files.</p>
        </div>
      </div>

      <Card className="flex items-center justify-between p-4 bg-indigo-50 border-indigo-100">
        <div className="flex gap-2">
          <Button variant="primary" className="gap-2 bg-indigo-600 hover:bg-indigo-700"><FilePlus className="w-4 h-4" /> Add Files</Button>
          <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-100"><FolderPlus className="w-4 h-4" /> Add Folder</Button>
        </div>
        <div className="flex gap-2">
          <select className="h-10 px-3 rounded-lg border border-indigo-200 bg-white text-sm text-indigo-900 font-medium">
            <option>Encrypt Files</option>
            <option>Add Password</option>
            <option>Apply Permissions</option>
            <option>Add Watermark</option>
            <option>Remove Metadata</option>
          </select>
          <Button variant="primary" className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md" onClick={handleStartDemo} disabled={isDemoRunning}>
            <Play className="w-4 h-4" /> Start Batch (Demo)
          </Button>
        </div>
      </Card>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE7FA] bg-[#F3F7FF]/50 text-[#071747]/60 text-sm">
                <th className="px-5 py-3 font-medium w-10"><input type="checkbox" className="rounded text-[#075BE8]" /></th>
                <th className="px-5 py-3 font-medium">File Name</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium">Pages</th>
                <th className="px-5 py-3 font-medium">Selected Action</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#071747]">
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-[#DCE7FA] last:border-0 hover:bg-[#F3F7FF] transition-colors group">
                  <td className="px-5 py-4"><input type="checkbox" className="rounded text-[#075BE8]" /></td>
                  <td className="px-5 py-4 font-medium flex items-center gap-2">
                    <File className="w-4 h-4 text-[#075BE8]" /> {job.name}
                  </td>
                  <td className="px-5 py-4 text-[#071747]/60">{job.size}</td>
                  <td className="px-5 py-4 text-[#071747]/60">{job.pages}</td>
                  <td className="px-5 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{job.action}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-semibold ${
                        job.status.includes('Completed') ? 'text-green-600' :
                        job.status === 'Processing' ? 'text-[#075BE8]' :
                        'text-slate-500'
                      }`}>{job.status}</span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${job.status.includes('Completed') ? 'bg-green-500' : 'bg-[#075BE8]'}`} style={{ width: `${job.progress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {job.status.includes('Completed') && <button className="p-1.5 text-slate-500 hover:text-orange-500" title="Demo Output (No file)"><AlertCircle className="w-4 h-4" /></button>}
                      <button className="p-1.5 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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