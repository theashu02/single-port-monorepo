'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI Button exists as seen earlier, else fallback to standard button

export default function DashboardPage() {
  const reduxMessage = useAppSelector((state) => state.test.message);
  const { data: session } = useSession();

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard Page</h1>
        <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/auth' })}>
          Log Out
        </Button>
      </div>

      {session?.user && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#e0f7fa', borderRadius: '8px', color: '#006064' }}>
          <h3>Welcome, {session.user.name || 'User'}!</h3>
          <p>Email: {session.user.email}</p>
          <p>User ID: {session.user.id}</p>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px', color: '#000' }}>
        <p>This data is retrieved from the Redux Store:</p>
        <h2 style={{ color: '#0070f3' }}>{reduxMessage}</h2>
      </div>

      <div style={{ marginTop: '20px' }}>
        <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
