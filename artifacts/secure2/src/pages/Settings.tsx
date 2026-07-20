import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const STORAGE_KEY = 'luxor-secure:preferences';

interface Preferences {
  defaultDpi: 72 | 144 | 216;
  defaultImageFormat: 'png' | 'jpg' | 'webp' | 'bmp';
  confirmBeforeClear: boolean;
  showActivityOnDashboard: boolean;
  keepActivityHistory: boolean;
}

const DEFAULT_PREFS: Preferences = {
  defaultDpi: 144,
  defaultImageFormat: 'png',
  confirmBeforeClear: true,
  showActivityOnDashboard: true,
  keepActivityHistory: true,
};

export function loadPreferences(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

type Section = 'general' | 'privacy' | 'about';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'privacy', label: 'Privacy & Data' },
  { id: 'about', label: 'About' },
];

export function Settings() {
  const [section, setSection] = useState<Section>('general');
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);
  const [saved, setSaved] = useState(false);
  const { activities } = useAppStore();

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setSaved(true);
    } catch {
      alert('Preferences could not be saved. Local storage may be unavailable in this browser.');
    }
  };

  const clearLocalData = () => {
    if (prefs.confirmBeforeClear && !window.confirm('Remove all locally stored data (recent files list, activity history, shares, preferences)? Your actual documents are never stored by this app.')) {
      return;
    }
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('luxor-secure:')) keys.push(k);
    }
    keys.forEach(k => window.localStorage.removeItem(k));
    window.location.reload();
  };

  const toggleRow = (label: string, key: keyof Preferences) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="rounded"
        checked={prefs[key] as boolean}
        onChange={e => update(key, e.target.checked as Preferences[typeof key])}
      />
      <span className="text-sm text-[#071747]">{label}</span>
    </label>
  );

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
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                section === s.id
                  ? 'bg-[#075BE8] text-white shadow-sm'
                  : 'hover:bg-slate-100 text-[#071747]/80 hover:text-[#071747]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === 'general' && (
          <Card className="md:col-span-3 space-y-6">
            <h3 className="font-bold text-[#071747] border-b border-[#DCE7FA] pb-3">General Settings</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#071747] mb-1.5">Default image quality (PDF to Images)</label>
                <div className="grid grid-cols-3 gap-2 max-w-md">
                  {([72, 144, 216] as const).map(dpi => (
                    <button
                      key={dpi}
                      type="button"
                      onClick={() => update('defaultDpi', dpi)}
                      className={`px-2 py-2 rounded-lg border text-center transition-colors ${
                        prefs.defaultDpi === dpi
                          ? 'border-[#075BE8] bg-blue-50 text-[#075BE8]'
                          : 'border-[#DCE7FA] text-[#071747]/70 hover:border-[#075BE8]/40'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{dpi === 72 ? 'Standard' : dpi === 144 ? 'High' : 'Ultra'}</span>
                      <span className="block text-[11px] opacity-70">{dpi} DPI</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#071747] mb-1.5">Default image format</label>
                <div className="grid grid-cols-4 gap-2 max-w-md">
                  {(['png', 'jpg', 'webp', 'bmp'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => update('defaultImageFormat', fmt)}
                      className={`px-2 py-1.5 rounded-lg border text-sm font-semibold uppercase transition-colors ${
                        prefs.defaultImageFormat === fmt
                          ? 'border-[#075BE8] bg-blue-50 text-[#075BE8]'
                          : 'border-[#DCE7FA] text-[#071747]/70 hover:border-[#075BE8]/40'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {toggleRow('Show recent activity on the Dashboard', 'showActivityOnDashboard')}
                {toggleRow('Keep a history of completed operations', 'keepActivityHistory')}
              </div>

              <div className="pt-4 flex items-center gap-3">
                <Button onClick={save}>Save Preferences</Button>
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Preferences saved
                  </span>
                )}
              </div>
            </div>
          </Card>
        )}

        {section === 'privacy' && (
          <Card className="md:col-span-3 space-y-6">
            <h3 className="font-bold text-[#071747] border-b border-[#DCE7FA] pb-3">Privacy & Data</h3>

            <div className="space-y-4 text-sm text-[#071747]/80">
              <p>
                LUXOR PDF Secure processes every document directly in your browser. Your PDFs are never uploaded to a
                server and never leave your device.
              </p>
              <p>
                The app stores only lightweight records on this device: your recent files list, activity history
                ({activities.length} {activities.length === 1 ? 'entry' : 'entries'}), secure share records, and preferences.
              </p>
            </div>

            <div className="space-y-3">
              {toggleRow('Ask for confirmation before clearing local data', 'confirmBeforeClear')}
            </div>

            <div className="pt-2 border-t border-[#DCE7FA]">
              <p className="text-sm font-semibold text-[#071747] mt-4 mb-2">Clear local data</p>
              <p className="text-sm text-[#071747]/60 mb-4">
                Removes the recent files list, activity history, share records, and saved preferences from this browser.
                This cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={clearLocalData}>
                  Clear All Local Data
                </Button>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <Button onClick={save}>Save Preferences</Button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Preferences saved
                </span>
              )}
            </div>
          </Card>
        )}

        {section === 'about' && (
          <Card className="md:col-span-3 space-y-6">
            <h3 className="font-bold text-[#071747] border-b border-[#DCE7FA] pb-3">About</h3>

            <div className="space-y-4 text-sm text-[#071747]/80">
              <div>
                <p className="text-base font-bold text-[#071747]">LUXOR PDF Secure</p>
                <p className="text-[#071747]/60">Part of the Luxor PDF Suite</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-w-md">
                <span className="text-[#071747]/60">Processing</span>
                <span>Fully in-browser</span>
                <span className="text-[#071747]/60">Document uploads</span>
                <span>None — files stay on your device</span>
                <span className="text-[#071747]/60">Encryption tools</span>
                <span>Password, permissions, redaction</span>
                <span className="text-[#071747]/60">Conversion tools</span>
                <span>PDF to and from Word, Excel, images</span>
              </div>
              <p className="pt-2">
                Built with open-source technology including PDF.js and pdf-lib. All interface designs and workflows are
                original to Luxor PDF.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
