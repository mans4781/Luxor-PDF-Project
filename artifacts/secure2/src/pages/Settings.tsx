import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-600 flex items-center justify-center text-white shadow-sm">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071747]">Settings</h1>
          <p className="text-[#071747]/60 text-sm">Configure application preferences and defaults.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          {['General', 'Security', 'Notifications', 'Account', 'About'].map(section => (
            <button key={section} className="w-full text-left px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-100 text-[#071747]/80 hover:text-[#071747] transition-colors">
              {section}
            </button>
          ))}
        </div>
        
        <Card className="md:col-span-3 space-y-6">
          <h3 className="font-bold text-[#071747] border-b border-[#DCE7FA] pb-3">General Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#071747] mb-1.5">Default Output Folder</label>
              <div className="flex gap-2">
                <input type="text" value="C:\Users\Admin\Documents\LUXOR Output" readOnly className="flex-1 h-10 px-3 rounded-lg border border-[#DCE7FA] bg-slate-50 text-sm text-[#071747]/60" />
                <Button variant="outline">Browse</Button>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-[#071747]">Open output folder after processing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-[#071747]">Confirm before overwriting files</span>
              </label>
            </div>
            
            <div className="pt-6">
              <Button>Save Preferences</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}