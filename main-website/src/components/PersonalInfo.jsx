import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Fingerprint,
  Languages
} from 'lucide-react';

const PersonalInfo = () => {
  const { user, setUser, updateProfile } = useAuth();
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (file && user) {
      const formData = new FormData();
      formData.append('profilePicture', file);

      try {
        // Use axios directly to upload to the correct endpoint
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/user/upload-profile-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': localStorage.getItem('customerAuthToken')
          }
        });

        if (response.data.success) {
          // Refresh user data to get the updated profile picture
          const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
            headers: { 'x-auth-token': localStorage.getItem('customerAuthToken') }
          });
          setUser(userRes.data);

          const imageUrl = URL.createObjectURL(file);
          setImage(imageUrl);
          alert('Profile picture updated successfully!');
        } else {
          alert('Failed to update profile picture.');
        }
      } catch (error) {
        console.error('Error updating profile picture:', error);
        alert('Failed to update profile picture.');
      }
    } else if (!user) {
      alert('Please log in to update your profile picture.');
    }
  };

  // No need for useEffect - AuthContext handles user loading

  const userData = user || {};
  const displayImage = image || (userData.profilePicture && !userData.profilePicture.startsWith('file://')
    ? (userData.profilePicture.startsWith('http')
        ? userData.profilePicture
        : `${process.env.REACT_APP_API_URL}${userData.profilePicture}`)
    : null) || `https://ui-avatars.com/api/?name=${userData.name || 'User'}&background=6366f1&color=fff`;

  return (
    <div className="min-h-screen bg-slate-950 pt-16 md:pt-24 pb-12 px-4 sm:px-6 relative overflow-hidden font-sans text-slate-200 md:min-h-screen md:overflow-hidden h-screen overflow-y-auto md:h-auto">

       {/* Background Elements */}
       <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
          {/* Light Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
       </div>

       <div className="max-w-4xl mx-auto relative z-10">

          {/* Header */}
          <div className="mb-10 pt-9 text-center sm:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
               <UserIcon size={12} />
               Account Settings
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
              Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Profile</span>
            </h1>
            <p className="text-slate-400">Manage your identity and account preferences.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Identity Card (4 columns) */}
            <div className="lg:col-span-4 animate-slide-up">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-300">
                 {/* Decorative top gradient */}
                 <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>

                 <div className="relative mb-6 group-hover:scale-105 transition-transform duration-500">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-slate-800 relative z-10">
                       <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 relative">
                          <img
                            src={displayImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                       </div>
                    </div>
                    {/* Glowing ring behind */}
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl -z-10 animate-pulse-slow"></div>
                 </div>

                 <h2 className="text-xl font-bold text-white font-display mb-1">{userData.name || 'Guest User'}</h2>
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
                    <ShieldCheck size={12} />
                    Verified Member
                 </div>

                 <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
              </div>
            </div>

            {/* Right Column: Details (8 columns) */}
            <div className="lg:col-span-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
               <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 h-full">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                     <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Fingerprint size={20} />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-white font-display">General Information</h3>
                        <p className="text-xs text-slate-500">View and manage your account details.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                     {/* Name Field */}
                     <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                           <UserIcon size={12} /> Full Name
                        </label>
                        <div className="w-full bg-slate-950/50 border border-white/5 group-hover:border-white/10 rounded-xl px-4 py-3 text-slate-200 font-medium transition-all">
                           {userData.name || 'Not set'}
                        </div>
                     </div>

                     {/* Gender Field */}
                     <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                           <Fingerprint size={12} /> Gender
                        </label>
                        <div className="w-full bg-slate-950/50 border border-white/5 group-hover:border-white/10 rounded-xl px-4 py-3 text-slate-200 font-medium transition-all">
                           {userData.gender || 'Not specified'}
                        </div>
                     </div>

                     {/* Email Field */}
                     <div className="sm:col-span-2 space-y-2 group">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                           <Mail size={12} /> Email Address
                        </label>
                        <div className="w-full bg-slate-950/50 border border-white/5 group-hover:border-white/10 rounded-xl px-4 py-3 text-slate-200 font-medium transition-all flex items-center justify-between">
                           <span>{userData.email || 'Not set'}</span>
                           {userData.email && <ShieldCheck size={16} className="text-emerald-500" />}
                        </div>
                     </div>

                     {/* Phone Field */}
                     <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                           <Phone size={12} /> Phone Number
                        </label>
                        <div className="w-full bg-slate-950/50 border border-white/5 group-hover:border-white/10 rounded-xl px-4 py-3 text-slate-200 font-medium transition-all">
                           {userData.phone || 'Not set'}
                        </div>
                     </div>

                     {/* Language Field */}
                     <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                           <Languages size={12} /> Language
                        </label>
                        <div className="w-full bg-slate-950/50 border border-white/5 group-hover:border-white/10 rounded-xl px-4 py-3 text-slate-200 font-medium transition-all">
                           {userData.language || 'English (Default)'}
                        </div>
                     </div>

                  </div>
               </div>
            </div>

          </div>
       </div>
    </div>
  );
};

export default PersonalInfo;
