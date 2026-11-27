'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ClinicData {
  clinic: {
    id: string;
    slug: string;
    name: string;
    theme_color: string;
    emergency_contact: string;
    booking_policy: string;
  };
  metrics: {
    activeBookings: number;
    heldSlots: number;
    openEscalations: number;
    totalRevenue: number;
    availableSlots: number;
  };
  appointments: Array<{
    id: string;
    patient_name: string;
    patient_phone: string;
    patient_age?: number;
    symptoms_summary?: string;
    doctor_name?: string;
    slot_time?: string;
    status: string;
    payment_status: string;
    created_at: string;
  }>;
  escalations: Array<{
    id: string;
    session_id: string;
    patient_phone?: string;
    reason: string;
    severity: 'ROUTINE' | 'EMERGENCY';
    transcript_summary?: string;
    status: string;
    created_at: string;
  }>;
  auditLogs: Array<{
    id: string;
    actor_type: string;
    actor_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata: Record<string, any>;
    created_at: string;
  }>;
  doctors: Array<{
    id: string;
    name: string;
    qualification: string;
    department_name?: string;
    consultation_fee_inr: number;
    is_active: boolean;
  }>;
}

export default function DashboardPage() {
  const [selectedClinic, setSelectedClinic] = useState<string>('clinic_alpha');
  const [data, setData] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'doctors' | 'escalations' | 'audit'>('appointments');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDashboardData = async (slug: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/staff?clinicId=${slug}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedClinic);
    // Poll every 5 seconds for realtime simulation
    const interval = setInterval(() => {
      fetchDashboardData(selectedClinic);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedClinic]);

  const handleResolveEscalation = async (escId: string) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_ESCALATION',
          clinic_id: selectedClinic,
          escalation_id: escId,
        }),
      });
      if (res.ok) {
        setActionMessage('Escalation ticket marked as resolved.');
        setTimeout(() => setActionMessage(null), 3000);
        fetchDashboardData(selectedClinic);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleDoctor = async (doctorId: string, currentState: boolean) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_DOCTOR',
          clinic_id: selectedClinic,
          doctor_id: doctorId,
          is_active: !currentState,
        }),
      });
      if (res.ok) {
        setActionMessage('Doctor availability status updated.');
        setTimeout(() => setActionMessage(null), 3000);
        fetchDashboardData(selectedClinic);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const emergencyEscalations = (data?.escalations || []).filter(
    (e) => e.severity === 'EMERGENCY' && e.status === 'OPEN'
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">
              CK
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg">
                  {data?.clinic.name || 'Clinic Staff Portal'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-slate-500">ComedKares Multi-Tenant Receptionist Dashboard</p>
            </div>
          </div>

          {/* Tenant Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-100">
              <button
                onClick={() => setSelectedClinic('clinic_alpha')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedClinic === 'clinic_alpha'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🦷 Sparsh Dental
              </button>
              <button
                onClick={() => setSelectedClinic('clinic_beta')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedClinic === 'clinic_beta'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🦴 Sahyadri Ortho
              </button>
            </div>

            <a
              href={selectedClinic === 'clinic_alpha' ? '/demo/clinic-alpha.html' : '/demo/clinic-beta.html'}
              target="_blank"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              Open Demo Site ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Emergency Alert Banner */}
        {emergencyEscalations.length > 0 && (
          <div className="mb-6 rounded-2xl bg-red-50 border-2 border-red-500 p-4 shadow-lg shadow-red-100 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-sm font-black text-red-900 uppercase tracking-wide">
                    CRITICAL EMERGENCY RED-FLAG ALERT ({emergencyEscalations.length} Active)
                  </h3>
                  <p className="text-xs text-red-700 mt-1">
                    The AI Receptionist detected acute life-threatening symptoms and halted normal booking to escalate to medical staff immediately.
                  </p>
                  <div className="mt-3 space-y-2">
                    {emergencyEscalations.map((esc) => (
                      <div key={esc.id} className="bg-white/80 p-3 rounded-lg border border-red-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-red-800">Reason: {esc.reason}</span>
                          <div className="text-xs text-slate-600">
                            Patient Phone: {esc.patient_phone || 'Direct Web Voice Call'} • Logged: {new Date(esc.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleResolveEscalation(esc.id)}
                          className="px-3 py-1 text-xs font-bold rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action toast */}
        {actionMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">
            ✓ {actionMessage}
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Bookings</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics.activeBookings || 0}</div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">Confirmed & Paid</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">5-Min Slot Holds</div>
            <div className="text-2xl font-black text-amber-600">{data?.metrics.heldSlots || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Atomic Lock Active</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Open Escalations</div>
            <div className="text-2xl font-black text-red-600">{data?.metrics.openEscalations || 0}</div>
            <div className="text-xs text-red-600 mt-1 font-semibold">Requires Staff Action</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Available Slots</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics.availableSlots || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Next 7 Days</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Fee Revenue</div>
            <div className="text-2xl font-black text-indigo-600">₹{(data?.metrics.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="text-xs text-slate-500 mt-1">Razorpay Verified</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'appointments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Appointments ({data?.appointments.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'doctors'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            👨‍⚕️ Doctors & Schedule ({data?.doctors.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('escalations')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'escalations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🚨 Escalations & Triage ({data?.escalations.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📜 Immutable Audit Trail ({data?.auditLogs.length || 0})
          </button>
        </div>

        {/* TAB 1: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Real-Time Patient Appointments</h3>
              <span className="text-xs text-slate-500">Auto-updating every 5s</span>
            </div>

            {data?.appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No appointments booked yet. Open the demo clinic website and book via the AI receptionist widget!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Slot Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Booked At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{appt.patient_name}</td>
                        <td className="py-3 px-4 text-slate-600">{appt.patient_phone}</td>
                        <td className="py-3 px-4 text-indigo-600 font-semibold">{appt.doctor_name || 'Doctor'}</td>
                        <td className="py-3 px-4">
                          {appt.slot_time ? new Date(appt.slot_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            appt.status === 'BOOKED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appt.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            appt.payment_status === 'PAID'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {appt.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(appt.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCTORS & SCHEDULE */}
        {activeTab === 'doctors' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Consultant Roster & Schedule Controls</h3>
              <span className="text-xs text-slate-500">Staff can toggle availability overrides</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Doctor Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Qualifications</th>
                    <th className="py-3 px-4">Consultation Fee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{doc.name}</td>
                      <td className="py-3 px-4 text-slate-600">{doc.department_name}</td>
                      <td className="py-3 px-4 text-slate-500">{doc.qualification}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">₹{doc.consultation_fee_inr}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          doc.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {doc.is_active ? 'AVAILABLE' : 'OFF-DUTY'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleDoctor(doc.id, doc.is_active)}
                          className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                            doc.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {doc.is_active ? 'Mark Off-Duty' : 'Mark Available'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ESCALATIONS & TRIAGE */}
        {activeTab === 'escalations' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Triage & Escalation Tickets</h3>
            </div>
            {data?.escalations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No active or historical escalations recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data?.escalations.map((esc) => (
                  <div key={esc.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          esc.severity === 'EMERGENCY'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {esc.severity}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{esc.reason}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{esc.transcript_summary}</p>
                      <div className="text-[11px] text-slate-400">
                        Session: {esc.session_id} • Logged at: {new Date(esc.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      {esc.status === 'OPEN' ? (
                        <button
                          onClick={() => handleResolveEscalation(esc.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
                        >
                          Resolve Ticket
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Resolved ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: IMMUTABLE AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Immutable Security & Compliance Audit Log</h3>
              <span className="text-xs text-slate-500">Every state-change is strictly appended</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor Type</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                          {log.actor_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-indigo-700">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-600">{log.entity_type}:{log.entity_id.substring(0, 8)}</td>
                      <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                        {JSON.stringify(log.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
