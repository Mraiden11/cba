// app/dashboard/student/[studentID]/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import React from 'react';

interface PageProps {
  params: { studentID: string };
}

export default async function StudentDashboard({ params }: PageProps) {
  const { data: student, error } = await supabase
    .from('students')
    .select(
      `
      *,
      class:class_id (name),
      student_fee_types (
        fee_type_id,
        fee_type:fee_type_id (name, default_amount, description)
      ),
      payments (
        id, amount_paid, date, mode_of_payment, receipt_number, description
      ),
      ledger_entries (
        id, date, type, description, debit, credit, balance, receipt_number
      )
    `
    )
    .eq('id', params.studentID)
    .single();

  if (error || !student) return notFound();

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>
        <p>
          <strong>Name:</strong> {student.name}
        </p>
        <p>
          <strong>Roll No:</strong> {student.roll_no}
        </p>
        <p>
          <strong>Academic Year:</strong> {student.academic_year}
        </p>
        <p>
          <strong>Status:</strong> {student.status}
        </p>
        <p>
          <strong>Class:</strong> {student.class?.name || 'N/A'}
        </p>
        <p>
          <strong>Total Fees:</strong> ₹{student.total_fees}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Assigned Fee Types</h2>
        <ul className="list-disc pl-5">
          {student.student_fee_types.map((item: any) => (
            <li key={item.fee_type_id}>
              {item.fee_type.name} - ₹{item.fee_type.default_amount} (
              {item.fee_type.description})
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Payments</h2>
        <table className="w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">Mode</th>
              <th className="border px-2 py-1">Receipt</th>
              <th className="border px-2 py-1">Description</th>
            </tr>
          </thead>
          <tbody>
            {student.payments.map((p: any) => (
              <tr key={p.id}>
                <td className="border px-2 py-1">
                  {new Date(p.date).toLocaleDateString()}
                </td>
                <td className="border px-2 py-1">₹{p.amount_paid}</td>
                <td className="border px-2 py-1">{p.mode_of_payment}</td>
                <td className="border px-2 py-1">{p.receipt_number}</td>
                <td className="border px-2 py-1">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Ledger</h2>
        <table className="w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Type</th>
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">Debit</th>
              <th className="border px-2 py-1">Credit</th>
              <th className="border px-2 py-1">Balance</th>
              <th className="border px-2 py-1">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {student.ledger_entries.map((l: any) => (
              <tr key={l.id}>
                <td className="border px-2 py-1">
                  {new Date(Number(l.date)).toLocaleDateString()}
                </td>
                <td className="border px-2 py-1">{l.type}</td>
                <td className="border px-2 py-1">{l.description}</td>
                <td className="border px-2 py-1">
                  {l.debit ? `₹${l.debit}` : '-'}
                </td>
                <td className="border px-2 py-1">
                  {l.credit ? `₹${l.credit}` : '-'}
                </td>
                <td className="border px-2 py-1">₹{l.balance}</td>
                <td className="border px-2 py-1">{l.receipt_number || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
