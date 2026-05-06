
"use client";

import React from 'react';
import { useUserStore } from '@/lib/user-store';
import { UserRole } from '@/lib/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  permission?: string;
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, permission, fallback = null }: RoleGuardProps) {
  const { currentUser, hasRole, hasPermission } = useUserStore();

  if (!currentUser) return null;

  let isAllowed = true;

  if (allowedRoles) {
    isAllowed = hasRole(allowedRoles);
  }

  if (permission && isAllowed) {
    isAllowed = hasPermission(permission);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
