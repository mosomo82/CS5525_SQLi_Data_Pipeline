import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Globe, PieChart as PieChartIcon, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [detections, setDetections] = useState([]);
  const [stats, setStats]           = useState({ total: 0, blocked: 0, critical: 0 });

  useEffect(() => {
    fetchDetections();
    const interval = setInterval(fetchDetections, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchDetections() {
    try {
      const res  = await fetch(`${API_URL}/detections`);
      const data = await res.json();
      const items = data.items || [];
      setDetections(items);
      setStats({
        total:    items.length,
        blocked:  items.filter(d => d.waf_action === 'BLOCK').length,
        critical: items.filter(d => d.severity === 'CRITICAL').length
      });
    } catch (e) {
      console.error("Fetch error. Ensure your API Gateway is running at: " + API_URL, e);
    }
  }

  // --- Dynamic Chart Data Construction ---
  
  // 1. Attack Types (Bar Chart)
  const attackTypes = {};
  detections.forEach(d => { 
    const type = d.attack_type || 'Unknown';
    attackTypes[type] = (attackTypes[type] || 0) + 1; 
  });
  const attackTypeData = Object.entries(attackTypes).map(([name, count]) => ({ name, count }));

  // 2. Blocked vs Allowed (Pie Chart)
  const allowed = stats.total - stats.blocked;
  const blockedData = [
    { name: 'Blocked', value: stats.blocked, color: '#10b981' },
    { name: 'Allowed', value: allowed, color: '#ef4444' },
  ];

  return (
    <div className="dashboard-grid">
      
      {/* Header */}
      <div className="col-span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h1 className="title">SQL Injection Detection Engine</h1>
          <p className="subtitle"><span className="live-indicator"></span> Live Database Monitoring Active • Last API Polled: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="glass-panel" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ShieldCheck size={32} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Security Hub Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>87%</div>
          </div>
        </div>
      </div>

      {/* Live Feed Table */}
      <div className="col-span-8 glass-panel" style={{ overflowY: 'auto', maxHeight: '500px' }}>
        <h2 className="card-title"><Activity size={20} color="#6366f1" /> Live Attack Feed</h2>
        {detections.length === 0 ? (
           <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Awaiting live events from API Database...</p>
        ) : (
          <table className="feed-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>Attack Pattern</th>
                <th>Source IP</th>
                <th>WAF Action</th>
              </tr>
            </thead>
            <tbody>
              {detections.slice(0, 20).map((det, index) => (
                <tr key={det.detection_id || index} style={{ animation: 'fadeIn 0.5s ease-out' }}>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(det.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</td>
                  <td><span className={`badge ${det.severity?.toLowerCase() || 'low'}`}>{det.severity}</span></td>
                  <td className="mono">{det.attack_type}</td>
                  <td className="mono">{det.source_ip}</td>
                  <td>
                    <span style={{ 
                      color: det.waf_action === 'BLOCK' ? 'var(--accent-success)' : 'var(--accent-critical)',
                      fontWeight: 600, fontSize: '0.85rem'
                    }}>
                      {det.waf_action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Attack Type Bar Chart */}
      <div className="col-span-4 glass-panel">
        <h2 className="card-title"><ShieldAlert size={20} color="#f97316" /> Attack Type Breakdown</h2>
        <div style={{ height: '250px', marginTop: '20px' }}>
          {attackTypeData.length === 0 ? (
             <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>No attack data</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackTypeData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} width={80} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} contentStyle={{ background: '#1a1e2c', border: '1px solid #6366f1', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Blocked Pie Chart */}
      <div className="col-span-6 glass-panel">
        <h2 className="card-title"><PieChartIcon size={20} color="#eab308" /> Blocked vs Allowed</h2>
        <div style={{ height: '220px', display: 'flex', alignItems: 'center' }}>
          {stats.total === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 'auto' }}>No event stats</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={blockedData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {blockedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1e2c', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ width: '100%' }}>
                {blockedData.map(d => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: d.color }}></div>
                      {d.name}
                    </span>
                    <span style={{ fontWeight: '600' }}>{Math.round((d.value / stats.total) * 100) || 0}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Origin Map Placeholder */}
      <div className="col-span-6 glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 className="card-title"><Globe size={20} color="#3b82f6" /> Source IP World Map</h2>
        <div style={{ 
          flex: 1, 
          background: 'rgba(59, 130, 246, 0.05)', 
          border: '1px dashed rgba(59, 130, 246, 0.3)', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
           [ Map Component Placeholder - Connect to GeoIP DB ]
        </div>
      </div>

    </div>
  );
}
