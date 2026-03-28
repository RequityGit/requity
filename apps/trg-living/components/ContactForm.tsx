'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ContactFormProps {
    propertyId: string;
    propertyName: string;
}


export default function ContactForm({ propertyId, propertyName }: ContactFormProps) {
    const supabase = createClient();

    // STATE MANAGEMENT
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [honeyPot, setHoneyPot] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // if honeypot is filled, act like it worked but do nothing
        if (honeyPot.length > 0) {
            setSubmitted(true);
            setLoading(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const payload = {
            property_id: propertyId,
            full_name: formData.get('full_name') as string,
            email: (formData.get('email') as string).trim().toLowerCase(),
            phone: formData.get('phone') as string,
            message: formData.get('message') as string,
            source_url: typeof window !== 'undefined' ? window.location.href : '',
            status: 'new'
        };

        // basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payload.email)) {
            setError("Please provide a valid email address.");
            setLoading(false);
            return;
        }

        if (payload.full_name.trim().length < 2) {
            setError("Please enter your full name.");
            setLoading(false);
            return;
        }

        try {
            const { error: dbError } = await supabase
                .from('pm_leads')
                .insert([payload]);
            
            if (dbError) throw dbError;

            setSubmitted(true);
        } catch (err: any) {
            console.error('Lead Submit Error:', err);
            setError("Something went wrong. Please try again or call us directly.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-emerald-50 p-12 rounded-3xl border border-emerald-100 text-center animate-in fade-in zoom-in duration-500">
                <h3 className="text-2xl font-black text-emerald-900 mb-2">Message Sent!</h3>
                <p>Thank you for your interest{propertyName ? ` in ${propertyName}` : ''}. We&apos;ll be in touch shortly.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* honeypot field*/}
            <input
                type="text"
                name="website_url"
                className="hidden"
                tabIndex={-1}
                value={honeyPot}
                onChange={(e) => setHoneyPot(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                    <input 
                        required 
                        name="full_name" 
                        type="text" 
                        placeholder="John Doe"
                        maxLength={100}
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium" 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                    <input 
                        name="phone" 
                        type="tel" 
                        placeholder="(555) 000-0000"
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium" 
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Address</label>
                <input 
                    required 
                    name="email" 
                    type="email"
                    maxLength={254}
                    placeholder="john@example.com"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium" 
                />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Message</label>
                <textarea 
                    required 
                    name="message" 
                    rows={4}
                    maxLength={1000}
                    placeholder="I'm interested in living at your community..."
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium" 
                />
            </div>

            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

            <button 
                disabled={loading}
                type="submit"
                className="w-full bg-[#2563eb] text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
            >
                {loading ? 'Sending...' : 'Submit Inquiry'}
            </button>
        </form>
    )
}