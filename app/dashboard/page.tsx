'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import Link from 'next/link';

export default function DashboardPage() {
  const reduxMessage = useAppSelector((state) => state.test.message);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard Page</h1>
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
