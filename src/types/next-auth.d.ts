import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
      doctorProfileId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    doctorProfileId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    doctorProfileId?: string | null;
  }
}
