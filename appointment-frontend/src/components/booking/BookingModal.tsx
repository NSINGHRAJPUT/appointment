'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '../ui/modal';
import { DoctorSelection } from './DoctorSelection';
import { SlotSelection } from './SlotSelection';
import { OTPVerification } from './OTPVerification';

type BookingStep = 'doctor' | 'slot' | 'otp';

export function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>('doctor');
  const [bookingData, setBookingData] = useState<{ doctorId?: string; slot?: string; phone?: string }>({});

  const handleDoctorSelect = (doctorId: string) => {
    setBookingData({ ...bookingData, doctorId });
    setStep('slot');
  };

  const handleSlotSelect = (slot: string) => {
    setBookingData({ ...bookingData, slot });
    setStep('otp');
  };

  const handleOTPConfirm = ({ phone, otp }: { phone: string; otp: string }) => {
    // In a real app, you'd verify the OTP via API here.
    console.log('Booking Confirmed', { ...bookingData, phone, otp });
    
    // Redirect to success page
    router.push(`/booking/success?doctor=${bookingData.doctorId}&slot=${bookingData.slot}`);
    
    // Reset and close
    setStep('doctor');
    setBookingData({});
    onClose();
  };

  const getStepTitle = () => {
    switch (step) {
      case 'doctor': return 'Select a Doctor';
      case 'slot': return 'Select Time Slot';
      case 'otp': return 'Verify Phone Number';
    }
  };

  const handleClose = () => {
    setStep('doctor');
    setBookingData({});
    onClose();
  };

  return (
    <Modal open={open} title={getStepTitle()} onClose={handleClose}>
      {step === 'doctor' && (
        <DoctorSelection onSelect={handleDoctorSelect} />
      )}
      {step === 'slot' && (
        <SlotSelection 
          onSelect={handleSlotSelect} 
          onBack={() => setStep('doctor')} 
        />
      )}
      {step === 'otp' && (
        <OTPVerification 
          onConfirm={handleOTPConfirm} 
          onBack={() => setStep('slot')} 
        />
      )}
    </Modal>
  );
}
