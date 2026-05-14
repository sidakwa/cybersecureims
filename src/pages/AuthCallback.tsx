import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, testSupabaseConnection } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Testing Supabase connection...');
        if (import.meta.env.DEV) {
          console.log('AuthCallback: Testing connection');
        }
        
        // Test connection first
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          console.error('Supabase connection failed');
          setError('Cannot connect to Supabase. Please check your network.');
          return;
        }
        
        setStatus('Getting session...');
        if (import.meta.env.DEV) {
          console.log('AuthCallback: Getting session');
        }
        
        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (session) {
          if (import.meta.env.DEV) {
            console.log('AuthCallback: Success for', session.user.email);
          }
          setStatus(`Welcome ${session.user.email}! Redirecting...`);
          
          // Small delay to ensure session is properly set
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          console.error('No session found');
          setError('No session found');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg max-w-md">
          <h1 className="text-red-600 text-xl mb-2">Authentication Error</h1>
          <p className="text-red-500">{error}</p>
          <p className="text-gray-500 text-sm mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{status}</p>
      </div>
    </div>
  );
}
