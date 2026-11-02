export type AuthUser = {
  sub: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  email: string;
};
