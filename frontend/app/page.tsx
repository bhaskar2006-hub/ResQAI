"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { supabase } from '@/lib/supabase';
import {
  Shield, Mail, Lock, Eye, EyeOff, ArrowRight,
  Radio, AlertTriangle, Activity, Flame, CloudRain
} from 'lucide-react';

const DisasterGlobe = dynamic(() => import('@/components/shared/DisasterGlobe'), { ssr: false });
const AmbientBackground = dynamic(() => import('@/components/shared/AmbientBackground'), { ssr: false });


export default function LoginPage() {
  const router = useRouter();
  const [email,        setEmail]        = useState('gov@resqai.com');
  const [password,     setPassword]     = useState('password123');
  const [showPass,     setShowPass]     = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [isLoggingIn,  setIsLoggingIn]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const [incidents,      setIncidents]      = useState(28);
  const [affected,       setAffected]       = useState(81500);
  const [resourcesCount, setResourcesCount] = useState(1847);
  const [aiAccuracy,     setAiAccuracy]     = useState(89);

  const fetchLiveStats = useCallback(async () => {
    try {
      const res = await api.get('/auth/stats') as {
        success?: boolean;
        data?: { incidents: number; resources: number; affected: number; aiAccuracy: number };
      };
      if (res.success && res.data) {
        setIncidents(res.data.incidents || 28);
        setResourcesCount(res.data.resources || 1847);
        setAffected(res.data.affected || 81500);
        setAiAccuracy(res.data.aiAccuracy || 89);
      }
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => {
    fetchLiveStats();
    const socket = getSocket();
    socket.on('newSOS',       fetchLiveStats);
    socket.on('sosUpdated',   fetchLiveStats);
    socket.on('actionApproved', fetchLiveStats);
    return () => {
      socket.off('newSOS',       fetchLiveStats);
      socket.off('sosUpdated',   fetchLiveStats);
      socket.off('actionApproved', fetchLiveStats);
    };
  }, [fetchLiveStats]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password }) as {
        success: boolean; token: string;
        data: { user: { role: string; name: string; email: string; id: string } };
      };
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        router.push(`/${response.data.user.role.toLowerCase()}`);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoggingIn(false);
    }
  };

  const demoRoles = [
    { label: 'Citizen',   email: 'citizen@resqai.com' },
    { label: 'Gov',       email: 'gov@resqai.com' },
    { label: 'Hospital',  email: 'hospital@resqai.com' },
    { label: 'NGO',       email: 'ngo@resqai.com' },
    { label: 'Volunteer', email: 'volunteer@resqai.com' },
  ];

  const affectedFmt = affected >= 1000 ? (affected / 1000).toFixed(1) + 'K' : String(affected);

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row relative noise-bg"
      style={{ background: '#07101f', color: '#e8edf5' }}
    >
      <AmbientBackground />

      {/* ══════════════════════════════════════
          LEFT — Map / viz panel
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-between p-6 lg:p-10 relative overflow-hidden"
           style={{ borderRight: '1px solid #1e3352' }}>

        {/* Brand */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-9 w-9 rounded-lg bg-[#0ea5e9] flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight leading-none" style={{ color: '#e8edf5' }}>ResQ AI</h1>
            <p className="text-[10px] font-mono tracking-widest font-semibold uppercase mt-0.5" style={{ color: '#0ea5e9' }}>EMERGENCY OS</p>
          </div>
        </div>

        {/* Central visualization — 3D Holographic Globe */}
        <div className="my-auto py-6 z-10 flex items-center justify-center w-full h-[500px] relative">
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden glass-panel border shadow-2xl"
          >
            {/* Holographic 3D Globe */}
            <DisasterGlobe />

            {/* Bottom stats row overlay */}
            <div className="absolute bottom-3 inset-x-3 grid grid-cols-2 sm:grid-cols-4 gap-2 z-20">
              {[
                { value: incidents.toString(),  label: 'Incidents' },
                { value: affectedFmt,            label: 'Affected'  },
                { value: resourcesCount.toString(), label: 'Resources' },
                { value: aiAccuracy + '%',        label: 'AI Acc.'   },
              ].map(stat => (
                <div key={stat.label} className="p-2 rounded-lg text-center glass-panel border border-border/30">
                  <p className="text-sm font-bold text-foreground text-glow-info tabular-nums">{stat.value}</p>
                  <p className="text-[8px] font-medium uppercase mt-0.5 tracking-wide text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copy */}
        <div className="space-y-3 z-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#e8edf5' }}>
              AI-powered disaster response.
            </h2>
            <h3 className="text-xl font-semibold tracking-tight" style={{ color: '#64748b' }}>
              When every second matters.
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs" style={{ color: '#64748b' }}>
            {[
              { icon: Activity, label: 'Real-time monitoring' },
              { icon: Shield,   label: 'AI-driven dispatch'  },
              { icon: Radio,    label: 'Global coverage'     },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" style={{ color: '#0ea5e9' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — Login form
      ══════════════════════════════════════ */}
      <div
        className="w-full lg:w-[460px] xl:w-[500px] flex flex-col justify-between p-6 lg:p-10 relative z-10"
        style={{ background: '#07101f' }}
      >
        {/* Demo role pills */}
        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          {demoRoles.map(demo => (
            <button
              key={demo.label}
              type="button"
              onClick={() => { setEmail(demo.email); setPassword('password123'); }}
              className="px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer"
              style={{
                background:   email === demo.email ? 'rgba(14,165,233,0.1)' : 'transparent',
                borderColor:  email === demo.email ? 'rgba(14,165,233,0.4)' : '#1e3352',
                color:        email === demo.email ? '#0ea5e9'              : '#64748b',
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="my-auto py-8">
          <div className="rounded-xl p-6 lg:p-8 space-y-5"
               style={{ background: '#0d1b2e', border: '1px solid #1e3352' }}>

            {/* SECURE ACCESS tag */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-mono font-semibold uppercase tracking-wider"
                 style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: '#0ea5e9' }}>
              <Shield className="h-3 w-3" />
              SECURE ACCESS
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight" style={{ color: '#e8edf5' }}>Sign in to ResQ AI</h3>
              <p className="text-xs" style={{ color: '#64748b' }}>Enter your credentials to access the command center.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg flex items-center gap-2 text-xs"
                   style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="commander@agency.gov"
                    className="w-full h-10 pl-10 pr-3 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#64748b' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 pl-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#64748b' }}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#64748b' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="hover:underline" style={{ color: '#0ea5e9' }}>Forgot password?</a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                style={{
                  background: '#0ea5e9',
                  color: '#ffffff',
                  opacity: isLoggingIn ? 0.7 : 1,
                }}
              >
                {isLoggingIn ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Command</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="absolute inset-x-0 h-px" style={{ background: '#1e3352' }} />
              <span className="relative px-3 text-[10px] font-medium uppercase tracking-widest"
                    style={{ background: '#0d1b2e', color: '#64748b' }}>OR</span>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all border"
              style={{ background: 'transparent', borderColor: '#1e3352', color: '#e8edf5' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0d2040')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={async () => {
                const redirectTo = `${window.location.origin}/auth/callback`;
                await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1,0,0,1,0,0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28-0.96,2.37-2.04,3.1v2.56h3.29c1.92-1.78,3.03-4.4,3.03-7.43C21.66,11.77,21.55,11.4,21.35,11.1z" fill="#4285F4"/>
                  <path d="M12,21c2.43,0,4.47-0.8,5.96-2.18l-2.92-2.26c-0.8,0.54-1.82,0.86-3.04,0.86-2.34,0-4.33-1.58-5.04-3.71H3.59v2.62C5.07,18.8,8.27,21,12,21z" fill="#34A853"/>
                  <path d="M6.96,13.71C6.77,13.17,6.67,12.6,6.67,12c0-0.6,0.1-1.17,0.29-1.71V7.67H3.59C2.95,8.96,2.58,10.42,2.58,12c0,1.58,0.37,3.04,1.01,4.33l3.37-2.62z" fill="#FBBC05"/>
                  <path d="M12,6.58c1.32,0,2.5,0.45,3.44,1.35l2.58-2.58C16.46,3.82,14.43,3,12,3C8.27,3,5.07,5.2,3.59,7.67l3.37,2.62C7.67,8.16,9.66,6.58,12,6.58z" fill="#EA4335"/>
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>

            <p className="text-center text-xs" style={{ color: '#64748b' }}>
              Don&apos;t have access?{' '}
              <a href="#" className="font-medium hover:underline" style={{ color: '#0ea5e9' }}>Request access →</a>
            </p>
          </div>
        </div>

        {/* Footer compliance */}
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider mt-4" style={{ color: '#1e3352' }}>
          <span>SOC 2 Type II</span>
          <span>FIPS 140-2</span>
          <span>GDPR</span>
        </div>
      </div>
    </div>
  );
}
