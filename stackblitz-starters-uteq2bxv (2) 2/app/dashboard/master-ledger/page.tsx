'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Payment = {
  date: string;
  amount_paid: number;
  mode_of_payment: string;
  receipt_number: string;
};

type StudentWithPayments = {
  id: string;
  name: string;
  roll_no: string;
  class: string;
  class_id: string;
  total_fees: number;
  status: 'paid' | 'partially_paid' | 'unpaid';
  academic_year?: string;
  payments?: Payment[];
  totalPaid?: number;
};

type ClassOption = {
  id: string;
  name: string;
};

export default function MasterLedger() {
  const router = useRouter();
  const [view, setView] = useState<'class' | 'school'>('school');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<StudentWithPayments[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch classes separately for the dropdown
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase.from('classes').select('id, name');
      if (error) throw error;
      setClassOptions(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase.from('students').select(`
          id,
          name,
          roll_no,
          total_fees,
          status,
          academic_year,
          class_id,
          classes(name),
          payments:payments (
            date,
            amount_paid,
            mode_of_payment,
            receipt_number
          )
        `);

      const { data, error } = await query;
      if (error) throw error;

      const enriched: StudentWithPayments[] = (data || [])
        .map((s: any) => {
          const totalPaid =
            s.payments?.reduce(
              (sum: number, p: Payment) => sum + p.amount_paid,
              0
            ) || 0;
          return {
            id: s.id,
            name: s.name,
            roll_no: s.roll_no,
            class: s.classes?.name || 'Unknown',
            class_id: s.class_id,
            total_fees: s.total_fees,
            status: s.status,
            academic_year: s.academic_year,
            payments: s.payments || [],
            totalPaid,
          };
        })
        .filter((s) => !selectedClassId || s.class_id === selectedClassId);

      setStudents(enriched);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClassId]);

  const filtered = students.filter((stu) => {
    const term = searchTerm.toLowerCase();
    return (
      stu.name.toLowerCase().includes(term) ||
      stu.roll_no.toLowerCase().includes(term) ||
      term === ''
    );
  });

  const handleExport = () => {
    if (!filtered.length) return;
    const header = [
      'Name',
      'Class',
      'Roll Number',
      'Total Fees',
      'Paid',
      'Balance',
      'Status',
      'Last Payment Date',
      'Last Payment Amount',
      'Payment Mode',
      'Academic Year',
      'Receipt Number',
    ];
    const rows = filtered.map((stu) => {
      const last = stu.payments?.[0];
      return [
        stu.name,
        stu.class,
        stu.roll_no,
        stu.total_fees.toFixed(2),
        (stu.totalPaid || 0).toFixed(2),
        (stu.total_fees - (stu.totalPaid || 0)).toFixed(2),
        stu.status,
        last ? new Date(last.date).toLocaleDateString() : '-',
        last ? last.amount_paid.toFixed(2) : '-',
        last ? last.mode_of_payment.replace('_', ' ') : '-',
        stu.academic_year || '-',
        last ? last.receipt_number : '-',
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${view}-${selectedClassId || 'all'}-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            className="p-2 border rounded-lg"
            value={view}
            onChange={(e) => setView(e.target.value as any)}
          >
            <option value="school">School Overview</option>
            <option value="class">Class View</option>
          </select>
          {view === 'class' && (
            <select
              className="p-2 border rounded-lg"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">All Classes</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            className="p-2 border rounded-lg w-full md:w-64"
            placeholder="🔍 Search student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          📥 Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-10">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-600 py-10">No records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Student / Class</th>
                <th className="px-4 py-2 text-right">Total Fees</th>
                <th className="px-4 py-2 text-right">Paid</th>
                <th className="px-4 py-2 text-right">Balance</th>
                <th className="px-4 py-2 text-left">Last Payment</th>
                <th className="px-4 py-2 text-left">Receipt</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {view === 'school'
                ? Array.from(new Set(filtered.map((s) => s.class))).map(
                    (cls) => {
                      const group = filtered.filter((s) => s.class === cls);
                      const totFees = group.reduce(
                        (a, s) => a + s.total_fees,
                        0
                      );
                      const totPaid = group.reduce(
                        (a, s) => a + (s.totalPaid || 0),
                        0
                      );
                      const unpaid = group.filter(
                        (s) => s.status === 'unpaid'
                      ).length;
                      const partial = group.filter(
                        (s) => s.status === 'partially_paid'
                      ).length;
                      return (
                        <tr
                          key={cls}
                          className="border-b hover:bg-indigo-50 cursor-pointer"
                          onClick={() => {
                            setView('class');
                            const classOption = classOptions.find(
                              (c) => c.name === cls
                            );
                            setSelectedClassId(
                              classOption ? classOption.id : ''
                            );
                          }}
                        >
                          <td className="px-4 py-3 font-semibold">
                            {cls}
                            <div className="text-sm text-gray-600">
                              {group.length} students
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            ₹{totFees.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ₹{totPaid.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ₹{(totFees - totPaid).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">—</td>
                          <td className="px-4 py-3">—</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="text-red-600">
                              {unpaid} unpaid
                            </span>
                            {partial > 0 && (
                              <span className="text-yellow-600">
                                {' '}
                                • {partial} partial
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )
                : filtered.map((stu) => {
                    const last = stu.payments?.[0];
                    return (
                      <tr
                        key={stu.id}
                        className="border-b hover:bg-indigo-50 cursor-pointer"
                        onClick={() => router.push(`/students/${stu.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{stu.name}</div>
                          <div className="text-sm text-gray-600">
                            {stu.class} • Roll: {stu.roll_no}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          ₹{stu.total_fees.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ₹{(stu.totalPaid || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ₹
                          {(
                            stu.total_fees - (stu.totalPaid || 0)
                          ).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {last
                            ? new Date(last.date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {last?.receipt_number || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-sm ${
                              stu.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : stu.status === 'partially_paid'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {stu.status === 'paid'
                              ? 'Paid'
                              : stu.status === 'partially_paid'
                              ? 'Partial'
                              : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
