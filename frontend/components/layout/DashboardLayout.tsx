"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, AlertTriangle, MapPin, Activity, Users,
  Building2, Heart, Shield, ChevronLeft, ChevronRight,
  LogOut, Bell, Radio, Zap, Cpu, X, Menu
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const roleNavItems: Record<string, NavItem[]> = {
  citizen: [
    { label: 'Dashboard',    href: '/citizen',          icon: LayoutDashboard },
    { label: 'Send SOS',     href: '/citizen/sos',       icon: AlertTriangle, badge: 'SOS' },
    { label: 'Shelters',     href: '/citizen/shelters',  icon: MapPin },
    { label: 'Alerts',       href: '/citizen/alerts',    icon: Bell },
    { label: 'Resources',    href: '/resources',         icon: Activity },
  ],
  government: [
    { label: 'Command Center', href: '/government',        icon: Shield },
    { label: 'Live Map',       href: '/government/map',    icon: MapPin },
    { label: 'Active SOS',     href: '/government/sos',    icon: AlertTriangle, badge: 'Live' },
    { label: 'AI Agents',      href: '/government/agents', icon: Zap },
    { label: 'Resources',      href: '/resources',         icon: Activity },
  ],
  hospital: [
    { label: 'Dashboard',    href: '/hospital',          icon: Building2 },
    { label: 'Bed Mgmt.',    href: '/hospital/beds',     icon: Activity },
    { label: 'Incoming',     href: '/hospital/incoming', icon: AlertTriangle },
    { label: 'Resources',    href: '/resources',         icon: Activity },
  ],
  ngo: [
    { label: 'Dashboard',    href: '/ngo',               icon: Heart },
    { label: 'Resources',    href: '/resources',         icon: Activity },
    { label: 'Volunteers',   href: '/ngo/volunteers',    icon: Users },
    { label: 'Distribution', href: '/ngo/distribution',  icon: MapPin },
  ],
  volunteer: [
    { label: 'Dashboard',  href: '/volunteer',        icon: LayoutDashboard },
    { label: 'My Tasks',   href: '/volunteer/tasks',  icon: Activity },
    { label: 'Map',        href: '/volunteer/map',    icon: MapPin },
    { label: 'Resources',  href: '/resources',         icon: Activity },
  ],
  admin: [
    { label: 'System',    href: '/admin',         icon: Shield },
    { label: 'Users',     href: '/admin/users',   icon: Users },
    { label: 'AI Models', href: '/admin/models',  icon: Zap },
    { label: 'Resources', href: '/resources',      icon: Activity },
  ],
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
  title: string;
  subtitle?: string;
}

const agentFeed = [
  { name: 'PredictAI', status: 'active', action: 'Analyzing wildfire spread vectors — Sierra Nevada +2.3km', time: '30s ago', severity: 'critical' as const },
  { name: 'RouteAI',   status: 'active', action: 'Recalculating evacuation corridor BRAVO-7 for 3,200 civilians', time: '1m ago', severity: 'high' as const },
  { name: 'ResourceAI',status: 'active', action: 'Dispatching 4 ambulances to Gulf Coast region', time: '2m ago', severity: 'medium' as const },
  { name: 'MedAI',     status: 'idle',   action: 'Awaiting incoming patient triage data', time: '5m ago', severity: 'low' as const },
  { name: 'CommsAI',   status: 'active', action: 'Broadcasting evacuation alert to Sector 7 residents', time: '3m ago', severity: 'high' as const },
];

function getSevClass(sev: string) {
  switch (sev) {
    case 'critical': return 'sev-critical';
    case 'high':     return 'sev-high';
    case 'medium':   return 'sev-medium';
    default:         return 'sev-low';
  }
}

export default function DashboardLayout({ children, role, title, subtitle }: DashboardLayoutProps) {
  const [collapsed,     setCollapsed]     = useState(false);
  const [aiPanelOpen,   setAiPanelOpen]   = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const navItems = roleNavItems[role.toLowerCase()] || [];
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHash(window.location.hash || '');
    }
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!stored || !token) {
      window.location.href = '/';
      return;
    }
    try { setCurrentUser(JSON.parse(stored)); } catch { /* ignore */ }
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  // Collapse sidebar on small screens by default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const handle = (e: MediaQueryListEvent) => { if (e.matches) setCollapsed(true); };
    if (mq.matches) setCollapsed(true);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  // Hide AI panel on medium screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1280px)');
    const handle = (e: MediaQueryListEvent) => { if (e.matches) setAiPanelOpen(false); };
    if (mq.matches) setAiPanelOpen(false);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'RC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Sidebar width values
  const sidebarW = collapsed ? 64 : 224; // px

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">

      {/* ── Mobile overlay ── */}
      {mobileMenuOpen && (
        <div
          ref={overlayRef}
          className="sidebar-overlay lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside
        style={{ width: sidebarW }}
        className={cn(
          "fixed left-0 top-0 h-full flex flex-col z-40 sidebar-transition",
          "bg-[#060e1d] border-r border-[#1e3352]",
          // Mobile: slide in/out
          "transition-transform lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-[#1e3352] gap-3 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 animate-glow-pulse">
            <Radio className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold tracking-tight text-foreground leading-none">ResQ AI</h1>
              <p className="text-[10px] text-primary font-mono tracking-wider mt-0.5">COMMAND OS</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasHash = item.href.includes('#');
            const targetHash = hasHash ? '#' + item.href.split('#')[1] : '';
            const targetPath = item.href.split('#')[0];
            const isBaseActive = pathname === targetPath;
            const isActive = isBaseActive && (hasHash ? currentHash === targetHash : !currentHash);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onClick={() => setCurrentHash(item.href.includes('#') ? '#' + item.href.split('#')[1] : '')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                    : "text-[#64748b] hover:text-foreground hover:bg-[#0d2040]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-xs font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badge === 'SOS' ? 'destructive' : 'default'}
                        className="text-[9px] px-1.5 leading-none py-0.5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-[#1e3352] space-y-0.5 shrink-0">
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-md text-xs text-[#64748b] hover:text-foreground hover:bg-[#0d2040] w-full transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-destructive hover:bg-destructive/10 w-full transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* User chip at bottom */}
        {!collapsed && (
          <div className="px-3 pb-3 shrink-0">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#0d2040] border border-[#1e3352]">
              <div className="h-7 w-7 rounded-full bg-primary text-white font-semibold text-[11px] flex items-center justify-center uppercase shrink-0">
                {getInitials(currentUser?.name)}
              </div>
              <div className="overflow-hidden leading-none">
                <p className="text-xs font-medium text-foreground truncate">{currentUser?.name || 'Operator'}</p>
                <p className="text-[10px] text-[#64748b] capitalize truncate">{currentUser?.role || role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ════════════════ MAIN CONTENT ════════════════ */}
      <div
        className="flex-1 flex flex-col min-w-0 content-transition"
        style={{ marginLeft: sidebarW, marginRight: aiPanelOpen ? 288 : 0 }}
      >
        {/* ── Status bar ── */}
        <div className="h-7 bg-[#040c18] text-[#64748b] flex items-center justify-between px-4 text-[10px] font-medium border-b border-[#1e3352] shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground tracking-wide hidden sm:inline">ResQ AI</span>
            <span className="hidden sm:inline text-[#1e3352]">|</span>
            <span className="truncate max-w-[180px] sm:max-w-none">{title}</span>
            {subtitle && (
              <>
                <span className="hidden md:inline text-[#1e3352]">|</span>
                <span className="hidden md:inline text-[#64748b]/70">{subtitle}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse-severity" />
              <span className="hidden sm:inline">System Online</span>
            </span>
            <span className="text-[#1e3352]">v2.0</span>
          </div>
        </div>

        {/* ── Top header ── */}
        <header className="h-14 border-b border-[#1e3352] bg-[#060e1d] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shrink-0">
          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md text-[#64748b] hover:text-foreground hover:bg-[#0d2040] mr-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs min-w-0">
            <span className="text-[#64748b] hidden sm:inline">Command Center</span>
            <ChevronRight className="h-3 w-3 text-[#1e3352] hidden sm:inline" />
            <span className="text-foreground font-medium truncate">{title}</span>
          </div>

          {/* Search — hidden on small screens */}
          <div className="hidden md:flex items-center max-w-[220px] lg:max-w-[280px] w-full relative mx-4">
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-8 pl-3 pr-8 rounded-md text-xs"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#64748b] border border-[#1e3352] px-1.5 py-0.5 rounded bg-[#0d1b2e]">⌘K</span>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            {/* Severity badges */}
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-medium">
              <span className="flex items-center gap-1 text-[#ef4444]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] animate-pulse-severity" />
                CRIT 2
              </span>
              <span className="text-[#1e3352]">|</span>
              <span className="text-[#f97316]">HIGH 3</span>
              <span className="text-[#1e3352]">|</span>
              <span className="text-[#f59e0b]">MED 2</span>
            </div>

            {/* Bell */}
            <button className="relative h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#0d2040] transition-colors">
              <Bell className="h-4 w-4 text-[#64748b]" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-destructive rounded-full text-[7px] text-white flex items-center justify-center font-bold">3</span>
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2 border-l border-[#1e3352] pl-3">
              <div className="h-7 w-7 rounded-full bg-primary text-white font-semibold text-[11px] flex items-center justify-center uppercase">
                {getInitials(currentUser?.name)}
              </div>
              <div className="hidden lg:block leading-none">
                <p className="text-xs font-medium text-foreground">{currentUser?.name || 'Operator'}</p>
                <p className="text-[10px] text-[#64748b] capitalize">{currentUser?.role || role}</p>
              </div>
            </div>

            {/* AI panel toggle */}
            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className={cn(
                "hidden xl:flex h-7 px-2 items-center gap-1.5 rounded-md text-[10px] font-medium transition-colors border",
                aiPanelOpen
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-[#64748b] border-[#1e3352] hover:text-foreground hover:bg-[#0d2040]"
              )}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>AI Panel</span>
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* ════════════════ AI AGENT PANEL ════════════════ */}
      <aside
        className={cn(
          "fixed right-0 top-0 h-full flex flex-col z-40",
          "bg-[#060e1d] border-l border-[#1e3352]",
          "transition-all duration-200",
          aiPanelOpen ? "w-[288px]" : "w-0 overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#1e3352] shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">AI Agents</h2>
            <span className="text-[9px] font-mono text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-1.5 py-0.5 rounded">LIVE</span>
          </div>
          <button
            onClick={() => setAiPanelOpen(false)}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#0d2040] text-[#64748b] hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {agentFeed.map((agent) => (
            <div key={agent.name} className="p-3 rounded-lg bg-[#0d1b2e] border border-[#1e3352] space-y-1.5 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    agent.status === 'active' ? 'bg-[#22c55e] animate-pulse-severity' : 'bg-[#64748b]'
                  )} />
                  <span className="text-xs font-medium text-foreground">{agent.name}</span>
                </div>
                <span className="text-[10px] text-[#64748b]">{agent.time}</span>
              </div>
              <p className="text-[11px] text-[#64748b] leading-relaxed">{agent.action}</p>
              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium", getSevClass(agent.severity))}>
                {agent.severity.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1e3352] shrink-0 bg-[#060e1d]">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#64748b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              <span>5 agents online</span>
            </div>
            <button
              onClick={() => setAiPanelOpen(false)}
              className="text-primary font-medium hover:underline text-[10px]"
            >
              Collapse
            </button>
          </div>
        </div>
      </aside>

      {/* AI panel open tab (when closed) */}
      {!aiPanelOpen && (
        <button
          onClick={() => setAiPanelOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 h-20 w-6 bg-[#0d1b2e] border border-[#1e3352] border-r-0 rounded-l-md flex items-center justify-center hover:bg-[#0d2040] transition-colors"
          title="Open AI panel"
        >
          <Cpu className="h-3 w-3 text-primary" />
        </button>
      )}

    </div>
  );
}
