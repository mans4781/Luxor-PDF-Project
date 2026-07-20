import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  FileText, ShieldCheck, HardDrive, Share2, Layers, 
  Clock, Lock, KeyRound, Eraser, FileStack, ArrowRight, Upload
} from 'lucide-react';
import { Link } from 'wouter';

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { recentFiles, activities, secureShares } = useAppStore();

  const stats = [
    { label: 'PDFs Secured', value: '1,248', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Files Processed', value: '3,842', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Storage Used', value: '4.2 GB', icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Secure Shares', value: '156', icon: Share2, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const quickActions = [
    { title: 'Encrypt PDF', desc: 'Secure with AES-256', icon: Lock, path: '/encrypt' },
    { title: 'Add Password', desc: 'Protect from viewing', icon: KeyRound, path: '/password' },
    { title: 'Redact Info', desc: 'Remove sensitive data', icon: Eraser, path: '/redact' },
    { title: 'Merge & Split', desc: 'Organize documents', icon: FileStack, path: '/merge-split' },
    { title: 'Secure Share', desc: 'Create expirable links', icon: Share2, path: '/share' },
    { title: 'Batch Process', desc: 'Automate multiple files', icon: Layers, path: '/batch' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#071747]">Dashboard</h1>
          <p className="text-[#071747]/60 mt-1">Protect, manage and process your PDF documents securely.</p>
        </div>
        <Button className="gap-2" onClick={() => setLocation('/encrypt')}>
          <Upload className="w-4 h-4" /> Add PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="flex items-center gap-4 p-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#071747]">{stat.value}</div>
              <div className="text-sm text-[#071747]/60 font-medium">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-bold text-[#071747] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.path}>
              <Card className="p-5 flex items-center justify-between cursor-pointer hover:border-[#0878FF] hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F3F7FF] flex items-center justify-center text-[#075BE8] group-hover:bg-[#075BE8] group-hover:text-white transition-colors">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#071747]">{action.title}</div>
                    <div className="text-xs text-[#071747]/60">{action.desc}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#071747]/30 group-hover:text-[#0878FF] transition-colors" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Files Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#071747]">Recent Files</h2>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/storage')}>View All</Button>
        </div>
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE7FA] bg-[#F3F7FF]/50 text-[#071747]/60 text-sm">
                  <th className="px-6 py-3 font-medium">File Name</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Pages</th>
                  <th className="px-6 py-3 font-medium">Security Status</th>
                  <th className="px-6 py-3 font-medium">Last Modified</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#071747]">
                {recentFiles.map((file) => (
                  <tr key={file.id} className="border-b border-[#DCE7FA] last:border-0 hover:bg-[#F3F7FF] transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#075BE8]" />
                      {file.name}
                    </td>
                    <td className="px-6 py-4 text-[#071747]/60">{(file.size / 1000000).toFixed(1)} MB</td>
                    <td className="px-6 py-4 text-[#071747]/60">{file.pages}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        file.status === 'Encrypted' ? 'bg-green-100 text-green-700' :
                        file.status === 'Unsecured' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {file.status} {file.encryptionLevel && `(${file.encryptionLevel})`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#071747]/60">
                      {new Date(file.lastModified).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}