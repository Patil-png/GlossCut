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
   const { user, setUser } = useAuth();
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
      <div className="min-h-screen bg-white pt-16 md:pt-24 pb-12 px-4 sm:px-6 relative overflow-hidden font-sans text-gray-900">

         {/* SHARED BACKGROUND WRAPPER */}
         <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Unified Background (Desktop Style for All) */}
            <div className="fixed inset-0 pointer-events-none z-0">
               <div className="absolute inset-0 bg-[#f8fafc]"></div>
               {/* Animated Blobs - INCREASED SIZE FOR MOBILE */}
               <div className="absolute top-[-20%] right-[-20%] w-[90vw] h-[90vw] md:top-[-10%] md:right-[-5%] md:w-[45vw] md:h-[45vw] bg-green-200/40 rounded-full blur-[80px] md:blur-[120px] animate-blob mix-blend-multiply filter" />
               <div className="absolute top-[-20%] left-[-20%] w-[90vw] h-[90vw] md:top-[-10%] md:left-[-5%] md:w-[45vw] md:h-[45vw] bg-emerald-200/40 rounded-full blur-[80px] md:blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply filter" />
               <div className="absolute bottom-[-20%] left-[10%] w-[90vw] h-[90vw] md:bottom-[-20%] md:left-[20%] md:w-[50vw] md:h-[50vw] bg-teal-200/40 rounded-full blur-[80px] md:blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply filter" />
               <div className="absolute top-[20%] right-[20%] w-[70vw] h-[70vw] md:w-[35vw] md:h-[35vw] bg-lime-200/40 rounded-full blur-[80px] md:blur-[120px] animate-blob animation-delay-3000 mix-blend-multiply filter" />

               {/* Grid Pattern */}
               <div
                  className="absolute inset-0 opacity-[0.4]"
                  style={{
                     backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)
          `,
                     backgroundSize: '40px 40px'
                  }}
               />
            </div>
         </div>

         <div className="max-w-6xl mx-auto relative z-10">

            {/* Header */}
            <div className="mb-10 pt-9 text-center sm:text-left animate-fade-in-up">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-200 rounded-full text-green-800 text-xs font-bold uppercase tracking-widest mb-3">
                  <UserIcon size={12} />
                  Account Settings
               </div>
               <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2">
                  Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">Profile</span>
               </h1>
               <p className="text-gray-500">Manage your identity and account preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

               {/* Left Column: Identity Card (4 columns) */}
               <div className="lg:col-span-4 animate-slide-up">
                  <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2rem] p-8 flex flex-col items-center text-center relative overflow-hidden group hover:border-[#4C763B]/30 transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                     {/* Decorative top gradient */}
                     <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#4C763B]/10 to-transparent pointer-events-none"></div>

                     <div className="relative mb-6 group-hover:scale-105 transition-transform duration-500">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#4C763B] via-green-500 to-gray-200 relative z-10">
                           <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                              <img
                                 src={displayImage}
                                 alt="Profile"
                                 className="w-full h-full object-cover"
                              />
                           </div>
                        </div>
                        {/* Glowing ring behind */}
                        <div className="absolute inset-0 rounded-full bg-[#4C763B]/20 blur-xl -z-10 animate-pulse-slow"></div>
                     </div>

                     <h2 className="text-xl font-bold text-gray-900 font-display mb-1">{userData.name || 'Guest User'}</h2>
                     <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-800 text-xs font-medium mb-6">
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
                  <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2rem] p-8 sm:p-10 h-full shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                     <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-200">
                        <div className="p-2 bg-green-100 rounded-lg text-[#4C763B]">
                           <Fingerprint size={20} />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 font-display">General Information</h3>
                           <p className="text-xs text-gray-500">View and manage your account details.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                        {/* Name Field */}
                        <div className="space-y-2 group">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-[#4C763B] transition-colors">
                              <UserIcon size={12} /> Full Name
                           </label>
                           <div className="w-full bg-gray-50/50 border border-gray-200 group-hover:border-[#4C763B]/30 group-hover:bg-green-50 rounded-xl px-4 py-3.5 text-gray-900 font-medium transition-all duration-300 shadow-sm hover:shadow-md">
                              {userData.name || 'Not set'}
                           </div>
                        </div>

                        {/* Gender Field */}
                        <div className="space-y-2 group">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-[#4C763B] transition-colors">
                              <Fingerprint size={12} /> Gender
                           </label>
                           <div className="w-full bg-gray-50/50 border border-gray-200 group-hover:border-[#4C763B]/30 group-hover:bg-green-50 rounded-xl px-4 py-3.5 text-gray-900 font-medium transition-all duration-300 shadow-sm hover:shadow-md">
                              {userData.gender || 'Not specified'}
                           </div>
                        </div>

                        {/* Email Field */}
                        <div className="sm:col-span-2 space-y-2 group">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-[#4C763B] transition-colors">
                              <Mail size={12} /> Email Address
                           </label>
                           <div className="w-full bg-gray-50/50 border border-gray-200 group-hover:border-[#4C763B]/30 group-hover:bg-green-50 rounded-xl px-4 py-3.5 text-gray-900 font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-between">
                              <span>{userData.email || 'Not set'}</span>
                              {userData.email && <ShieldCheck size={16} className="text-emerald-500" />}
                           </div>
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2 group">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-[#4C763B] transition-colors">
                              <Phone size={12} /> Phone Number
                           </label>
                           <div className="w-full bg-gray-50/50 border border-gray-200 group-hover:border-[#4C763B]/30 group-hover:bg-green-50 rounded-xl px-4 py-3.5 text-gray-900 font-medium transition-all duration-300 shadow-sm hover:shadow-md">
                              {userData.phone || 'Not set'}
                           </div>
                        </div>

                        {/* Language Field */}
                        <div className="space-y-2 group">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-[#4C763B] transition-colors">
                              <Languages size={12} /> Language
                           </label>
                           <div className="w-full bg-gray-50/50 border border-gray-200 group-hover:border-[#4C763B]/30 group-hover:bg-green-50 rounded-xl px-4 py-3.5 text-gray-900 font-medium transition-all duration-300 shadow-sm hover:shadow-md">
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
