export type UserRole = 'organizer' | 'referee' | 'admin' | 'athlete';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  clubName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  assignedCourts?: number[]; // For referees assigned to specific courts
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  courtPin?: string; // For referee quick PIN access
}

export interface RegisterOrganizerData {
  fullName: string;
  email: string;
  password?: string;
  clubName: string;
  phoneNumber: string;
}
