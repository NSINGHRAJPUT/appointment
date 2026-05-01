'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function OTPVerification({ onConfirm, onBack }: { onConfirm: (details: { phone: string; otp: string }) => void, onBack: () => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendOTP = () => {
    if (phone.length >= 10) {
      setIsSending(true);
      setTimeout(() => {
        setIsSending(false);
        setStep('otp');
      }, 1000); // Simulate API call
    }
  };

  const handleConfirm = () => {
    if (otp.length >= 4) {
      onConfirm({ phone, otp });
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-500 mb-4">
        {step === 'phone' 
          ? 'Enter your phone number to proceed. No signup required.' 
          : `We've sent a 4-digit code to ${phone}. Enter it below to confirm your booking.`}
      </div>

      {step === 'phone' ? (
        <div className="space-y-4">
          <Input 
            type="tel" 
            placeholder="Phone Number (e.g. 9876543210)" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />
          <div className="pt-2 flex justify-between">
            <Button variant="outline" onClick={onBack}>Back</Button>
            <Button onClick={handleSendOTP} disabled={phone.length < 10 || isSending}>
              {isSending ? 'Sending...' : 'Send OTP'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input 
            type="text" 
            placeholder="Enter OTP (e.g. 1234)" 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)} 
            maxLength={4}
          />
          <div className="pt-2 flex justify-between">
            <Button variant="outline" onClick={() => setStep('phone')}>Change Number</Button>
            <Button onClick={handleConfirm} disabled={otp.length < 4}>
              Confirm Booking
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
