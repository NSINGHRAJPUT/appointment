'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const MOCK_DOCTORS = [
  { id: '1', name: 'Dr. Sarah Smith', email: 'sarah@example.com', status: 'PENDING', submitted: '2023-10-24' },
  { id: '2', name: 'Dr. John Doe', email: 'john@example.com', status: 'APPROVED', submitted: '2023-10-20' },
  { id: '3', name: 'Dr. Emily Chen', email: 'emily@example.com', status: 'REJECTED', submitted: '2023-10-21' },
];

export function DoctorVerificationTable() {
  const [doctors, setDoctors] = useState(MOCK_DOCTORS);

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setDoctors(prev => prev.map(doc => doc.id === id ? { ...doc, status: action } : doc));
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
            <tr>
              <th className="px-6 py-4">Doctor</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {doctors.map(doctor => (
              <tr key={doctor.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-900">{doctor.name}</div>
                  <div className="text-zinc-500">{doctor.email}</div>
                </td>
                <td className="px-6 py-4 text-zinc-500">{doctor.submitted}</td>
                <td className="px-6 py-4">
                  <Badge tone={doctor.status === 'APPROVED' ? 'success' : doctor.status === 'REJECTED' ? 'destructive' : 'warning'}>
                    {doctor.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  {doctor.status === 'PENDING' ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleAction(doctor.id, 'APPROVED')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleAction(doctor.id, 'REJECTED')}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost">View Details</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
