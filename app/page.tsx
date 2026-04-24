'use client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function HomePage() {
  const [data, setData] = useState<any>(null);

  const fetchElysia = async () => {
    const res = await fetch('/api/hello'); // Same port!
    const json = await res.json();
    setData(json);
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Next.js + Elysia (Single Port)</h1>
      <Button
        onClick={fetchElysia}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        Test Elysia API
      </Button>

      {data && (
        <pre style={{ marginTop: '20px', background: '#222', color: '#fff', padding: '15px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}