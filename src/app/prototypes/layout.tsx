import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PrototypesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      allowedRoles={['admin', 'organizer', 'referee']} 
      requiredPermissionName="Khu Vực Thử Nghiệm (Prototypes)"
    >
      {children}
    </ProtectedRoute>
  );
}
