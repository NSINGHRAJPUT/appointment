'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

export function IncomingRequestModal() {
  const router = useRouter();
  // In a real app, this state would be driven by a WebSocket or SSE connection
  const [incomingRequest, setIncomingRequest] = useState<{ id: string, patientName: string, type: 'Video' | 'Chat' } | null>(null);

  // For demonstration, uncomment to simulate an incoming request
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      setIncomingRequest({ id: '123', patientName: 'Jane Doe', type: 'Video' });
    }, 15000);
    return () => clearTimeout(timer);
  }, []);
  */

  if (!incomingRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-zinc-200">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="material-symbols-outlined text-[32px]">ring_volume</span>
        </div>
        
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Incoming {incomingRequest.type} Consult</h2>
        <p className="text-zinc-500 mb-6">
          <strong>{incomingRequest.patientName}</strong> is requesting an instant consultation.
        </p>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={() => setIncomingRequest(null)}
          >
            Decline
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              setIncomingRequest(null);
              router.push(incomingRequest.type === 'Video' ? '/call' : '/chat');
            }}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
