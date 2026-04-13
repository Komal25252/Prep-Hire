'use client';

import { useState } from 'react';
import { User, Mail, Phone, Briefcase, MapPin, Download, Save } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    jobTitle: 'Software Engineer',
    targetRole: 'Senior Frontend Engineer',
    bio: 'Passionate about building user-friendly applications and continuous learning.',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const inputStyle = {
    backgroundColor: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    width: '100%',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>My Profile</h1>
            <p className="text-lg" style={{ color: 'var(--color-text)' }}>Manage your account and interview preferences</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-2 rounded-lg font-semibold transition hover:opacity-90"
            style={{ backgroundColor: isEditing ? 'var(--color-card)' : 'var(--color-accent)', color: isEditing ? 'var(--color-text)' : 'var(--color-background)' }}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl p-8 mb-8" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-6 mb-8 pb-8" style={{ borderBottom: '1px solid var(--color-background)' }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary)' }}>
              <User className="w-12 h-12" style={{ color: 'var(--color-background)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-secondary)' }}>{formData.name}</h2>
              <p style={{ color: 'var(--color-text)' }}>{formData.jobTitle}</p>
              <button className="mt-2 text-sm font-semibold hover:opacity-80" style={{ color: 'var(--color-accent)' }}>Change Avatar</button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Full Name', name: 'name', type: 'text', icon: null },
                  { label: 'Email', name: 'email', type: 'email', icon: Mail },
                  { label: 'Phone', name: 'phone', type: 'tel', icon: Phone },
                  { label: 'Location', name: 'location', type: 'text', icon: MapPin },
                ].map(({ label, name, type, icon: Icon }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      {Icon && <Icon className="w-4 h-4" />} {label}
                    </label>
                    <input type={type} name={name} value={(formData as any)[name]} onChange={handleInputChange} disabled={!isEditing} style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {[
                  { label: 'Current Job Title', name: 'jobTitle' },
                  { label: 'Target Role', name: 'targetRole' },
                ].map(({ label, name }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      <Briefcase className="w-4 h-4" /> {label}
                    </label>
                    <input type="text" name={name} value={(formData as any)[name]} onChange={handleInputChange} disabled={!isEditing} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Professional Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} disabled={!isEditing} rows={4}
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>

            {isEditing && (
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-8 py-2 rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
                <Save className="w-5 h-5" /> Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-xl p-8 mb-8" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--color-secondary)' }}>Your Skills</h3>
          <div className="flex gap-2 flex-wrap">
            {['JavaScript', 'React', 'TypeScript', 'Node.js', 'SQL', 'CSS', 'HTML'].map((skill) => (
              <span key={skill} className="px-4 py-2 rounded-full font-semibold text-sm" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-secondary)' }}>{skill}</span>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-xl p-8 mb-8" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--color-secondary)' }}>Interview Preferences</h3>
          <div className="space-y-4">
            {['Email Notifications', 'Weekly Progress Report', 'Allow Resource Sharing'].map((label) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-lg" style={{ border: '1px solid var(--color-background)' }}>
                <label className="font-semibold" style={{ color: 'var(--color-text)' }}>{label}</label>
                <input type="checkbox" defaultChecked className="w-5 h-5" style={{ accentColor: 'var(--color-accent)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--color-secondary)' }}>Account Actions</h3>
          <div className="space-y-4">
            <button className="w-full flex items-center gap-3 p-4 rounded-lg transition hover:opacity-80" style={{ border: '1px solid var(--color-text)' }}>
              <Download className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              <div className="text-left">
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Download My Data</p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>Export your interview history and progress</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-lg transition hover:opacity-80" style={{ border: '1px solid var(--color-accent)' }}>
              <div className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--color-accent)' }}>✕</div>
              <div className="text-left">
                <p className="font-semibold" style={{ color: 'var(--color-accent)' }}>Delete Account</p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>Permanently remove your account and data</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
