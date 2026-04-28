'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, MapPin, Download, Save, Loader2, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    jobTitle: '',
    targetRole: '',
    bio: '',
    skills: [] as string[],
    preferences: {
      emailNotifications: true,
      weeklyReport: true,
      resourceSharing: true,
    }
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferenceToggle = (key: keyof typeof formData.preferences) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setStatus({ type: 'error', message: 'Failed to update profile.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    borderRadius: '0.75rem',
    padding: '0.625rem 1rem',
    width: '100%',
    transition: 'all 0.2s',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--color-background)' }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--color-accent)' }} />
        <p style={{ color: 'var(--color-text)' }}>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2" style={{ color: 'var(--color-text)' }}>Candidate Profile</h1>
            <p className="text-lg opacity-60" style={{ color: 'var(--color-text)' }}>Personalize your evaluation environment</p>
          </div>
          <div className="flex items-center gap-4">
            {status && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-right-4`}
                style={{ backgroundColor: status.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: status.type === 'success' ? '#22c55e' : '#ef4444' }}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {status.message}
              </div>
            )}
            <button
              onClick={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
              }}
              disabled={saving}
              className="px-8 py-3 rounded-xl font-black italic tracking-widest uppercase text-sm transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? <Save size={18} /> : 'Edit Profile')}
              {isEditing ? (saving ? 'Saving...' : 'Save Changes') : ''}
            </button>
            {isEditing && !saving && (
              <button 
                onClick={() => { setIsEditing(false); fetchProfile(); }}
                className="px-6 py-3 rounded-xl font-bold text-sm border hover:bg-white/5 transition-all"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="rounded-3xl p-8 mb-8 relative border overflow-hidden" 
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b" style={{ borderColor: 'var(--color-background)' }}>
            <div className="w-32 h-32 rounded-3xl flex items-center justify-center relative group" 
              style={{ backgroundColor: 'rgba(245,143,124,0.1)', border: '1px solid rgba(245,143,124,0.2)' }}>
              <User className="w-16 h-16" style={{ color: 'var(--color-accent)' }} />
              <div className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="text-[10px] font-black uppercase text-white">Upload</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black italic uppercase mb-1" style={{ color: 'var(--color-secondary)' }}>{formData.name}</h2>
              <p className="text-lg opacity-60 mb-3" style={{ color: 'var(--color-text)' }}>{formData.jobTitle || 'Role not specified'}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs font-bold uppercase tracking-widest">
                <span className="px-3 py-1 rounded-full bg-white/5 border" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>{formData.email}</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>{formData.location || 'Location Not Set'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <h3 className="text-sm font-black opacity-30 uppercase tracking-[0.2em] mb-8">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: 'Full Discovery Name', name: 'name', type: 'text', icon: User },
                  { label: 'System Email (Read Only)', name: 'email', type: 'email', icon: Mail, disabled: true },
                  { label: 'Direct Phone', name: 'phone', type: 'tel', icon: Phone },
                  { label: 'Base Location', name: 'location', type: 'text', icon: MapPin },
                ].map(({ label, name, type, icon: Icon, disabled }) => (
                  <div key={name}>
                    <label className="block text-[10px] font-black uppercase mb-3 tracking-widest opacity-40 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      <Icon className="w-3 h-3" /> {label}
                    </label>
                    <input 
                      type={type} 
                      name={name} 
                      value={(formData as any)[name]} 
                      onChange={handleInputChange} 
                      disabled={disabled || !isEditing} 
                      className={`hover:border-accent/30 focus:border-accent transition-all ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
                      style={inputStyle} 
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black opacity-30 uppercase tracking-[0.2em] mb-8">Professional Trajectory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {[
                  { label: 'Current Designation', name: 'jobTitle' },
                  { label: 'Desired Career Path', name: 'targetRole' },
                ].map(({ label, name }) => (
                  <div key={name}>
                    <label className="block text-[10px] font-black uppercase mb-3 tracking-widest opacity-40 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      <Briefcase className="w-3 h-3" /> {label}
                    </label>
                    <input 
                      type="text" 
                      name={name} 
                      value={(formData as any)[name]} 
                      onChange={handleInputChange} 
                      disabled={!isEditing} 
                      className="hover:border-accent/30 focus:border-accent transition-all"
                      style={inputStyle} 
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-3 tracking-widest opacity-40" style={{ color: 'var(--color-text)' }}>Performance Background / Bio</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleInputChange} 
                  disabled={!isEditing} 
                  rows={4}
                  placeholder="Tell us about your technical journey..."
                  className="hover:border-accent/30 focus:border-accent transition-all"
                  style={{ ...inputStyle, resize: 'none' }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-3xl p-8 mb-8 border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-black opacity-30 uppercase tracking-[0.2em] mb-6">Technical Arsenal</h3>
          {isEditing && (
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill (e.g. Next.js)..."
                style={inputStyle}
              />
              <button onClick={addSkill} className="p-3 rounded-xl transition-all hover:bg-accent hover:text-black" style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                <Plus size={20} />
              </button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {formData.skills.map((skill) => (
              <span key={skill} className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest border flex items-center gap-2 group transition-all hover:border-accent" 
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--color-secondary)' }}>
                {skill}
                {isEditing && (
                  <button onClick={() => removeSkill(skill)} className="text-red-400 opacity-40 hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                )}
              </span>
            ))}
            {formData.skills.length === 0 && <p className="text-sm italic opacity-40">No technical skills added yet.</p>}
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-3xl p-8 mb-8 border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-black opacity-30 uppercase tracking-[0.2em] mb-6">Evaluation Ecosystem</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Email Alerts', key: 'emailNotifications' as const },
              { label: 'Performance Reports', key: 'weeklyReport' as const },
              { label: 'Resource Sync', key: 'resourceSharing' as const },
            ].map(({ label, key }) => (
              <button 
                key={key}
                disabled={!isEditing}
                onClick={() => handlePreferenceToggle(key)}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${!isEditing ? 'opacity-80' : 'hover:scale-[1.02]'}`} 
                style={{ 
                  backgroundColor: formData.preferences[key] ? 'rgba(245,143,124,0.05)' : 'rgba(255,255,255,0.02)', 
                  borderColor: formData.preferences[key] ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)' 
                }}
              >
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: formData.preferences[key] ? 'var(--color-accent)' : 'var(--color-text)' }}>{label}</span>
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${formData.preferences[key] ? 'bg-accent border-accent' : 'border-neutral-700'}`} 
                  style={{ backgroundColor: formData.preferences[key] ? 'var(--color-accent)' : 'transparent' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="rounded-3xl p-8 border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-black opacity-30 uppercase tracking-[0.2em] mb-6">Archive Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center gap-4 p-5 rounded-2xl transition-all border hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="p-3 rounded-xl bg-accent/10" style={{ color: 'var(--color-accent)' }}>
                <Download size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>Export Protocol</p>
                <p className="text-[10px] opacity-40">Download full interview history</p>
              </div>
            </button>
            <button className="flex items-center gap-4 p-5 rounded-2xl transition-all border border-red-500/10 hover:bg-red-500/5 group">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                <XCircle size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-red-500">Purge Data</p>
                <p className="text-[10px] text-red-500/40">Permanently delete account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
