import React, { useEffect, useRef, useState } from 'react';
import { Camera, LogOut, Pencil, Trash2, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function Avatar({ name, photo, size }: { name: string; photo: string | null; size: number }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover border border-[#DCE7FA]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#075BE8] text-white flex items-center justify-center font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initialsOf(name)}
    </div>
  );
}

export function ProfileMenu() {
  const { profile, signOut, updateProfileName, updateProfilePhoto } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!profile) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError('Photo must be under 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateProfilePhoto(reader.result);
      }
    };
    reader.onerror = () => setPhotoError('Could not read that file. Please try another photo.');
    reader.readAsDataURL(file);
  };

  const startEdit = () => {
    setNameDraft(profile.name);
    setEditing(true);
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    updateProfileName(trimmed);
    setEditing(false);
  };

  return (
    <div className="relative" ref={menuRef} style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-[#075BE8]/40 transition-shadow"
        aria-label="Profile menu"
        title={profile.name}
      >
        <Avatar name={profile.name} photo={profile.photo} size={28} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-[0_20px_45px_-15px_rgba(7,23,71,0.35)] border border-[#DCE7FA] z-50 overflow-hidden">
          <div className="p-5 flex flex-col items-center gap-3 border-b border-[#EEF3FC]">
            <div className="relative">
              <Avatar name={profile.name} photo={profile.photo} size={72} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#075BE8] hover:bg-[#0878FF] text-white flex items-center justify-center shadow"
                aria-label="Upload photo"
                title="Upload photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            {profile.photo && (
              <button
                onClick={() => updateProfilePhoto(null)}
                className="text-[11px] text-[#071747]/50 hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Remove photo
              </button>
            )}
            {photoError && <p className="text-[11px] text-red-600 text-center">{photoError}</p>}

            {editing ? (
              <div className="w-full flex flex-col gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); }}
                  maxLength={60}
                  className="w-full h-9 px-3 rounded-lg border border-[#DCE7FA] text-sm text-[#071747] focus:outline-none focus:ring-2 focus:ring-[#075BE8]"
                  placeholder="Your name"
                />
                <div className="flex gap-2">
                  <Button size="sm" fullWidth onClick={saveName} disabled={!nameDraft.trim()}>Save</Button>
                  <Button size="sm" fullWidth variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold text-[#071747]">{profile.name}</p>
                <p className="text-xs text-[#071747]/50 mt-0.5" title="Email cannot be changed">{profile.email}</p>
              </div>
            )}
          </div>

          <div className="p-2">
            {!editing && (
              <button
                onClick={startEdit}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#071747] hover:bg-[#F3F7FF] transition-colors"
              >
                <Pencil className="w-4 h-4 text-[#075BE8]" /> Edit profile
              </button>
            )}
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WelcomeGate() {
  const { signIn } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) { setError('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { setError('Please enter a valid email address.'); return; }
    signIn(trimmedName, trimmedEmail);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl border border-[#DCE7FA] shadow-[0_20px_45px_-20px_rgba(7,91,232,0.3)] p-8 flex flex-col gap-4">
        <div className="text-center mb-2">
          <h1 className="text-lg font-semibold text-[#071747]">Welcome to Luxor PDF Secure</h1>
          <p className="text-xs text-[#071747]/50 mt-1">Set up your profile to continue. Your email is set once and cannot be changed later.</p>
        </div>
        <div>
          <label className="text-xs font-medium text-[#071747]/70 block mb-1.5">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
            className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] text-sm text-[#071747] focus:outline-none focus:ring-2 focus:ring-[#075BE8]"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[#071747]/70 block mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={120}
            className="w-full h-10 px-3 rounded-lg border border-[#DCE7FA] text-sm text-[#071747] focus:outline-none focus:ring-2 focus:ring-[#075BE8]"
            placeholder="you@example.com"
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1"><X className="w-3 h-3" /> {error}</p>
        )}
        <Button type="submit" fullWidth>Continue</Button>
      </form>
    </div>
  );
}
