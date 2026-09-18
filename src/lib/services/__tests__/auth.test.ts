import { describe, it, expect, beforeEach } from 'vitest';
import {
  signInWithQuickRole,
  signInWithEmail,
  signUpOrganizer,
  signInWithCourtPin,
  signOut,
  getCurrentUser,
  getCurrentSession,
  DEMO_ACCOUNTS,
} from '../authService';

describe('authService', () => {
  beforeEach(() => {
    signOut();
  });

  it('should have 3 preconfigured demo accounts (organizer, referee, admin)', () => {
    expect(DEMO_ACCOUNTS).toHaveLength(3);
    const roles = DEMO_ACCOUNTS.map((a) => a.role);
    expect(roles).toContain('organizer');
    expect(roles).toContain('referee');
    expect(roles).toContain('admin');
  });

  it('should start with no logged-in user after signOut', () => {
    expect(getCurrentUser()).toBeNull();
    expect(getCurrentSession()).toBeNull();
  });

  it('should allow 1-click login as organizer', () => {
    const session = signInWithQuickRole('organizer');
    expect(session).toBeDefined();
    expect(session.user.role).toBe('organizer');
    expect(session.user.email).toBe('btc@badminton.vn');
    expect(getCurrentUser()?.role).toBe('organizer');
  });

  it('should allow 1-click login as referee with assigned courts', () => {
    const session = signInWithQuickRole('referee');
    expect(session.user.role).toBe('referee');
    expect(session.user.assignedCourts).toEqual([1, 2, 3, 4]);
    expect(getCurrentUser()?.fullName).toBe('Trần Đình Toàn');
  });

  it('should allow 1-click login as admin', () => {
    const session = signInWithQuickRole('admin');
    expect(session.user.role).toBe('admin');
    expect(session.user.email).toBe('admin@badminton.vn');
  });

  it('should sign in with demo email', async () => {
    const result = await signInWithEmail('btc@badminton.vn');
    expect(result.success).toBe(true);
    expect(result.session?.user.role).toBe('organizer');
  });

  it('should register a new organizer account successfully', async () => {
    const result = await signUpOrganizer({
      fullName: 'Lê Hoàng Long',
      email: 'long.le@badmintonclub.vn',
      clubName: 'CLB Cầu Lông Long Biên',
      phoneNumber: '0901234567',
    });

    expect(result.success).toBe(true);
    expect(result.session?.user.fullName).toBe('Lê Hoàng Long');
    expect(result.session?.user.role).toBe('organizer');
    expect(result.session?.user.clubName).toBe('CLB Cầu Lông Long Biên');
    expect(getCurrentUser()?.email).toBe('long.le@badmintonclub.vn');
  });

  it('should reject registration with invalid email', async () => {
    const result = await signUpOrganizer({
      fullName: 'Test User',
      email: 'invalid-email',
      clubName: 'Club',
      phoneNumber: '123',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
  });

  it('should allow referee to unlock via court PIN', () => {
    const res = signInWithCourtPin(2, '1234');
    expect(res.success).toBe(true);
    expect(res.session?.user.role).toBe('referee');
    expect(res.session?.user.assignedCourts).toEqual([2]);
    expect(res.session?.user.fullName).toBe('Trọng Tài Sân 2');
  });

  it('should reject referee login with invalid PIN', () => {
    const res = signInWithCourtPin(2, '99');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('should clear session upon signOut', () => {
    signInWithQuickRole('organizer');
    expect(getCurrentUser()).not.toBeNull();
    signOut();
    expect(getCurrentUser()).toBeNull();
    expect(getCurrentSession()).toBeNull();
  });
});
