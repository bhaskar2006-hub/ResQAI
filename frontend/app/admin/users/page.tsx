"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { Users } from 'lucide-react';

interface UserRegistry {
  id: string; name: string; email: string; role: string; status: 'ONLINE' | 'OFFLINE'; lastActive: string;
}

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<UserRegistry[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users') as { success?: boolean; data?: { users?: Array<{ id: string; name: string; email: string; role: string }> } };
      if (res.success && res.data?.users) {
        const mapped: UserRegistry[] = res.data.users.map((u) => ({
          id: u.id.substring(0, 8), name: u.name, email: u.email, role: u.role, status: 'ONLINE' as const, lastActive: 'Just now',
        }));
        setUsersList(mapped);
      }
    } catch (err) { console.error('Failed to fetch users:', err); }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <DashboardLayout role="admin" title="Operator Directory" subtitle="System Control Center">
      <div className="max-w-4xl mx-auto bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Active Operator Directory
            </h3>
            <p className="text-[11px] text-[#64748b] mt-0.5">Operators currently authenticated to local node.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20">{usersList.length} Connected</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1e3352]">
            <thead className="bg-[#060e1d]">
              <tr>
                {['User ID', 'Operator Name', 'Email Address', 'Access Role', 'Status'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-[#64748b] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3352] text-xs text-[#64748b]">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#64748b] text-sm">
                    No operator sessions registered on this node.
                  </td>
                </tr>
              ) : usersList.map(usr => (
                <tr key={usr.id} className="hover:bg-[#0d2040] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-primary whitespace-nowrap">[{usr.id}]</td>
                  <td className="px-5 py-3 text-xs font-medium text-foreground whitespace-nowrap">{usr.name}</td>
                  <td className="px-5 py-3 font-mono text-xs whitespace-nowrap">{usr.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-[#0d2040] text-primary border border-primary/10 text-[9px] uppercase tracking-wider font-semibold">
                      {usr.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-xs text-[#22c55e]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse-severity" />
                      <span>{usr.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
