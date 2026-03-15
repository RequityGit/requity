'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    
    const router = useRouter();
    const supabase = createClient();

    // Fix for Hydration Error: Wait until client-side mount
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            router.push('/admin');
            router.refresh();
        }
    };

    // While the server is rendering, return a placeholder or the same shell
    // to keep the layout stable but avoid the div-in-div mismatch
    if (!mounted) return <div className="min-h-screen bg-slate-50" />;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-10 space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">TRG Admin</h1>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            autoComplete="username"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="email@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Password</label>
                        <input 
                            type="password"
                            required
                            autoComplete="current-password"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}