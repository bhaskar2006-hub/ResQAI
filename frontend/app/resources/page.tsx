"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/utils/api';
import {
  Building2, Home, Heart, Warehouse, Truck,
  Flame, ShoppingBag, MapPin, Bed,
  Droplet, Package, Hotel, Square, Utensils
} from 'lucide-react';

interface Totals {
  hospitals: { count: number; icuBeds: number; generalBeds: number; ambulances: number };
  shelters: { count: number; capacity: number; occupancy: number };
  ngos: { count: number; volunteers: number };
  warehouses: { count: number; foodKits: number; water: number; medicine: number };
  fireStations: { count: number; trucks: number };
}

interface DistrictInfo {
  hospitals: number; hospitalBeds: number; shelters: number; shelterCapacity: number;
  ngos: number; ngoVolunteers: number; warehouses: number;
  foodKits: number; water: number; medicine: number;
  fireStations: number; fireTrucks: number;
}

type TabType = 'overview' | 'hospitals' | 'ngos' | 'shelters' | 'warehouses' | 'supplies' | 'government';

const SUPPLY_ICONS: Record<string, React.ElementType> = {
  FOOD: Utensils, WATER: Droplet, MEDICINES: Package, TENTS: Hotel, BLANKETS: Square,
};

const SEVERITY_COLORS: Record<string, string> = {
  FOOD: 'bg-severity-low/10 text-severity-low border-severity-low/30',
  WATER: 'bg-primary/10 text-primary border-primary/30',
  MEDICINES: 'bg-severity-high/10 text-severity-high border-severity-high/30',
  TENTS: 'bg-severity-medium/10 text-severity-medium border-severity-medium/30',
  BLANKETS: 'bg-severity-unknown/10 text-severity-unknown border-severity-unknown/30',
};

export default function ResourcesPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [districtOverview, setDistrictOverview] = useState<Record<string, DistrictInfo>>({});
  const [districtSupplies, setDistrictSupplies] = useState<Record<string, Record<string, number>>>({});
  const [ngos, setNgos] = useState<Array<{ id: string; name: string; district: string; focus: string; volunteers: number; status: string }>>([]);
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string; district: string; state: string; icuBeds: number; generalBeds: number; ambulances: number; status: string }>>([]);
  const [shelters, setShelters] = useState<Array<{ id: string; name: string; district: string; capacity: number; occupancy: number }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; district: string; foodKits: number; water: number; medicine: number }>>([]);
  const [supplies, setSupplies] = useState<Array<{ id: string; type: string; district: string; quantity: number; status: string }>>([]);
  const [governmentOffices, setGovernmentOffices] = useState<Array<{ id: string; department: string; district: string; officer: string }>>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, ngosRes, hospitalsRes, sheltersRes, warehousesRes, suppliesRes, govRes] = await Promise.all([
        api.get('/data/district-overview'),
        api.get('/data/ngos'),
        api.get('/hospitals'),
        api.get('/shelters'),
        api.get('/data/warehouses'),
        api.get('/data/supplies'),
        api.get('/data/government-offices'),
      ]) as Record<string, unknown>[];

      const overview = overviewRes as { success?: boolean; data?: { totals?: Totals; districtOverview?: Record<string, DistrictInfo>; districtSupplies?: Record<string, Record<string, number>> } };
      if (overview.success && overview.data) {
        setTotals(overview.data.totals || null);
        setDistrictOverview(overview.data.districtOverview || {});
        setDistrictSupplies(overview.data.districtSupplies || {});
      }

      const n = ngosRes as { success?: boolean; data?: { ngos?: Array<{ id: string; name: string; district: string; focus: string; volunteers: number; status: string }> } };
      if (n.success && n.data?.ngos) setNgos(n.data.ngos);

      const h = hospitalsRes as { success?: boolean; data?: { hospitals?: Array<{ id: string; name: string; district: string; state: string; icuBeds: number; generalBeds: number; ambulances: number; status: string }> } };
      if (h.success && h.data?.hospitals) setHospitals(h.data.hospitals);

      const s = sheltersRes as { success?: boolean; data?: { shelters?: Array<{ id: string; name: string; district: string; capacity: number; occupancy: number }> } };
      if (s.success && s.data?.shelters) setShelters(s.data.shelters);

      const w = warehousesRes as { success?: boolean; data?: { warehouses?: Array<{ id: string; district: string; foodKits: number; water: number; medicine: number }> } };
      if (w.success && w.data?.warehouses) setWarehouses(w.data.warehouses);

      const sup = suppliesRes as { success?: boolean; data?: { supplies?: Array<{ id: string; type: string; district: string; quantity: number; status: string }> } };
      if (sup.success && sup.data?.supplies) setSupplies(sup.data.supplies);

      const g = govRes as { success?: boolean; data?: { offices?: Array<{ id: string; department: string; district: string; officer: string }> } };
      if (g.success && g.data?.offices) setGovernmentOffices(g.data.offices);
    } catch (err) {
      console.error('Failed to load resource data:', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!totals) {
    return (
      <DashboardLayout role="government" title="Resource Overview" subtitle="Loading synthetic dataset...">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2">
            <span className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">Loading resource data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const districts = Object.keys(districtOverview).sort();
  const totalBeds = totals.hospitals.icuBeds + totals.hospitals.generalBeds;
  const shelterOccupancyPct = totals.shelters.capacity > 0 ? Math.round((totals.shelters.occupancy / totals.shelters.capacity) * 100) : 0;

  const tabs: { key: TabType; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: MapPin },
    { key: 'hospitals', label: 'Hospitals', icon: Bed },
    { key: 'ngos', label: 'NGOs', icon: Heart },
    { key: 'shelters', label: 'Shelters', icon: Home },
    { key: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { key: 'supplies', label: 'Supplies', icon: ShoppingBag },
    { key: 'government', label: 'Govt Offices', icon: Building2 },
  ];

  return (
    <DashboardLayout role="government" title="Resource Overview" subtitle="Synthetic disaster resource dataset — 500 records each">
      <div className="space-y-5">

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-primary text-primary bg-accent/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border rounded-lg overflow-hidden">
              {[
                { label: 'Hospitals', value: totals.hospitals.count, icon: Bed, sub: `${totalBeds.toLocaleString()} beds` },
                { label: 'Shelters', value: totals.shelters.count, icon: Home, sub: `${shelterOccupancyPct}% occupied` },
                { label: 'NGOs', value: totals.ngos.count, icon: Heart, sub: `${totals.ngos.volunteers.toLocaleString()} volunteers` },
                { label: 'Warehouses', value: totals.warehouses.count, icon: Warehouse, sub: `${(totals.warehouses.foodKits + totals.warehouses.water + totals.warehouses.medicine).toLocaleString()} units` },
                { label: 'Fire Stations', value: totals.fireStations.count, icon: Flame, sub: `${totals.fireStations.trucks} trucks` },
                { label: 'Ambulances', value: totals.hospitals.ambulances, icon: Truck, sub: 'Across all hospitals' },
              ].map(stat => (
                <div key={stat.label} className="bg-card px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  District-wise Resource Distribution
                </CardTitle>
                <CardDescription>Overview of hospitals, NGOs, shelters, warehouses, and fire stations by district.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="min-w-full divide-y divide-border text-left">
                    <thead className="bg-card text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">District</th>
                        <th className="px-4 py-3">Hospitals</th>
                        <th className="px-4 py-3">Beds</th>
                        <th className="px-4 py-3">Shelters</th>
                        <th className="px-4 py-3">NGOs</th>
                        <th className="px-4 py-3">Volunteers</th>
                        <th className="px-4 py-3">Warehouses</th>
                        <th className="px-4 py-3">Fire Stations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs text-muted-foreground">
                      {districts.map(d => {
                        const info = districtOverview[d];
                        return (
                          <tr key={d} className="hover:bg-accent/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">{d}</td>
                            <td className="px-4 py-3">{info.hospitals}</td>
                            <td className="px-4 py-3">{info.hospitalBeds.toLocaleString()}</td>
                            <td className="px-4 py-3">{info.shelters}</td>
                            <td className="px-4 py-3">{info.ngos}</td>
                            <td className="px-4 py-3">{info.ngoVolunteers.toLocaleString()}</td>
                            <td className="px-4 py-3">{info.warehouses}</td>
                            <td className="px-4 py-3">{info.fireStations}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-severity-medium" />
                    Warehouse Inventory by District
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {districts.slice(0, 8).map(d => {
                      const info = districtOverview[d];
                      if (!info || !info.warehouses) return null;
                      const total = info.foodKits + info.water + info.medicine;
                      return (
                        <div key={d}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-foreground">{d}</span>
                            <span className="text-muted-foreground">{total.toLocaleString()} units</span>
                          </div>
                          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                            {info.foodKits > 0 && <div className="bg-severity-low h-full" style={{ width: `${(info.foodKits / total) * 100}%` }} title={`Food: ${info.foodKits}`} />}
                            {info.water > 0 && <div className="bg-primary h-full" style={{ width: `${(info.water / total) * 100}%` }} title={`Water: ${info.water}`} />}
                            {info.medicine > 0 && <div className="bg-severity-high h-full" style={{ width: `${(info.medicine / total) * 100}%` }} title={`Medicine: ${info.medicine}`} />}
                          </div>
                          <div className="flex gap-3 text-[9px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-severity-low" />{info.foodKits.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{info.water.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-severity-high" />{info.medicine.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-severity-high" />
                    Supply Distribution by District
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {districts.slice(0, 8).map(d => {
                      const ds = districtSupplies[d];
                      if (!ds) return null;
                      const types = Object.keys(ds);
                      return (
                        <div key={d} className="p-3 rounded-md border border-border/50">
                          <p className="text-xs font-semibold text-foreground mb-2">{d}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {types.map(t => {
                              const Icon = SUPPLY_ICONS[t] || ShoppingBag;
                              return (
                                <Badge key={t} variant="outline" className={`text-[10px] gap-1 ${SEVERITY_COLORS[t] || ''}`}>
                                  <Icon className="h-3 w-3" />
                                  {t}: {ds[t]}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'hospitals' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-severity-critical" />
                Hospital Registry
              </CardTitle>
              <CardDescription>{totals.hospitals.count} hospitals across {districts.length} districts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-card text-[10px] font-medium text-muted-foreground uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">District</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">ICU Beds</th>
                      <th className="px-4 py-3">General Beds</th>
                      <th className="px-4 py-3">Ambulances</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-muted-foreground">
                    {hospitals.map(h => (
                      <tr key={h.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground max-w-[120px] md:max-w-[200px] truncate">{h.name}</td>
                        <td className="px-4 py-3">{h.district}</td>
                        <td className="px-4 py-3">{h.state}</td>
                        <td className="px-4 py-3 font-medium">{h.icuBeds}</td>
                        <td className="px-4 py-3">{h.generalBeds}</td>
                        <td className="px-4 py-3">{h.ambulances}</td>
                        <td className="px-4 py-3">
                          <Badge variant={h.status === 'Available' ? 'success' : 'warning'} className="text-[9px]">{h.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'ngos' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-severity-critical" />
                NGO Directory
              </CardTitle>
              <CardDescription>{totals.ngos.count} NGOs with {totals.ngos.volunteers.toLocaleString()} volunteers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-card text-[10px] font-medium text-muted-foreground uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">District</th>
                      <th className="px-4 py-3">Focus</th>
                      <th className="px-4 py-3">Volunteers</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-muted-foreground">
                    {ngos.map(n => (
                      <tr key={n.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground max-w-[140px] md:max-w-[250px] truncate">{n.name}</td>
                        <td className="px-4 py-3">{n.district}</td>
                        <td className="px-4 py-3">
                          <Badge variant="default" className="text-[9px]">{n.focus}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{n.volunteers}</td>
                        <td className="px-4 py-3">
                          <Badge variant={n.status === 'Inactive' ? 'secondary' : 'success'} className="text-[9px]">{n.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'shelters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shelters.map(s => {
              const occPct = s.capacity > 0 ? Math.round((s.occupancy / s.capacity) * 100) : 0;
              return (
                <div key={s.id} className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium leading-tight">{s.name}</h4>
                    <Badge variant={occPct > 80 ? 'destructive' : occPct > 50 ? 'warning' : 'success'} className="text-[9px] shrink-0">
                      {occPct > 80 ? 'Full' : occPct > 50 ? 'Limited' : 'Open'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{s.district}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-medium">{s.occupancy}/{s.capacity}</span>
                    </div>
                    <Progress value={occPct} indicatorClassName={occPct > 80 ? 'bg-severity-critical' : occPct > 50 ? 'bg-severity-medium' : 'bg-severity-low'} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {warehouses.map(w => {
              return (
                <div key={w.id} className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium">{w.district} Warehouse</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-severity-low/5 border border-severity-low/20">
                      <p className="text-lg font-bold text-severity-low">{w.foodKits.toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">Food Kits</p>
                    </div>
                    <div className="p-2 rounded bg-primary/5 border border-primary/20">
                      <p className="text-lg font-bold text-primary">{w.water.toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">Water</p>
                    </div>
                    <div className="p-2 rounded bg-severity-high/5 border border-severity-high/20">
                      <p className="text-lg font-bold text-severity-high">{w.medicine.toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">Medicine</p>
                    </div>
                  </div>
                  <Progress value={100} indicatorClassName="bg-primary" />
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'supplies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {supplies.map(s => {
              const Icon = SUPPLY_ICONS[s.type] || ShoppingBag;
              return (
                <div key={s.id} className="p-4 rounded-lg border border-border/50 bg-card/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.type}</p>
                      <p className="text-[11px] text-muted-foreground">{s.district}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{s.quantity}</p>
                    <Badge variant="outline" className="text-[9px]">{s.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'government' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Government Offices
              </CardTitle>
              <CardDescription>Emergency response departments across districts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-card text-[10px] font-medium text-muted-foreground uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">District</th>
                      <th className="px-4 py-3">Officer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-muted-foreground">
                    {governmentOffices.map(o => (
                      <tr key={o.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{o.department}</td>
                        <td className="px-4 py-3">{o.district}</td>
                        <td className="px-4 py-3 font-mono">{o.officer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
