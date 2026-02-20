import { createContext } from 'react';
import { supabase } from '@/lib/supabase';

export type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
export type User = NonNullable<Session>['user'];

export interface AuthContextType {
  user: User | null;
  session: Session;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
