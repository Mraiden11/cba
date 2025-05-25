'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex justify-between items-center p-4 border-b shadow-sm mb-4">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <button
        onClick={handleLogout}
        className="text-red-600 hover:underline"
      >
        Logout
      </button>
    </div>
  );
}
