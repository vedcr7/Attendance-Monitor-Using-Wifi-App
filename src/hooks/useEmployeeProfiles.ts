/**
 * useEmployeeProfiles.ts — CRUD for employee profiles stored in AsyncStorage.
 */
import { useCallback, useEffect, useState } from 'react';
import uuid from 'react-native-uuid';
import {
  addEmployee,
  loadEmployees,
  removeEmployee,
  saveEmployees,
} from '../services/storageService';
import type { EmployeeProfile, UserRole } from '../types';

export function useEmployeeProfiles() {
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await loadEmployees();
    setProfiles(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(
    async (name: string, email: string, role: UserRole) => {
      const profile: EmployeeProfile = {
        id: uuid.v4() as string,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        createdAt: new Date().toISOString(),
      };
      const updated = await addEmployee(profile);
      setProfiles(updated);
      return profile;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    const updated = await removeEmployee(id);
    setProfiles(updated);
  }, []);

  const update = useCallback(
    async (id: string, patch: Partial<Pick<EmployeeProfile, 'name' | 'role'>>) => {
      const existing = await loadEmployees();
      const updated = existing.map(p => (p.id === id ? { ...p, ...patch } : p));
      await saveEmployees(updated);
      setProfiles(updated);
    },
    [],
  );

  return { profiles, isLoading, add, remove, update, reload: load };
}
