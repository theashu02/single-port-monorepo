'use client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setMessage } from '@/lib/redux/slices/testSlice';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface ElysiaResponse {
  status: string;
  data: string;
  hardcoded: Array<{ id: number; name: string }>;
}

export default function HomePage() {
  const [data, setData] = useState<ElysiaResponse | null>(null);
  const [inputText, setInputText] = useState('');
  const dispatch = useAppDispatch();
  const reduxMessage = useAppSelector((state) => state.test.message);

  const fetchElysia = async () => {
    const res = await fetch('/api/hello'); // Same port!
    const json = await res.json();
    setData(json);
  };

  const handleSaveToRedux = () => {
    dispatch(setMessage(inputText));
    setInputText('');
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Next.js + Elysia (Single Port)</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Button
          onClick={fetchElysia}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Test Elysia API
        </Button>
      </div>

      {data && (
        <pre style={{ marginBottom: '20px', background: '#222', color: '#fff', padding: '15px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}

      <hr style={{ margin: '20px 0' }} />

      <h2>Redux Test</h2>
      <p>Current Redux Message: <strong>{reduxMessage}</strong></p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <Input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter a message for Redux"
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', color: '#000' }}
        />
        <Button onClick={handleSaveToRedux}>Save to Redux</Button>
      </div>

      <div style={{ marginTop: '20px' }} className='bg-blue-500'>
        <Link href="/dashboard" style={{ color: 'blue', textDecoration: 'underline' }}>
          Go to Dashboard to check Redux State
        </Link>
      </div>
    </main>
  );
}