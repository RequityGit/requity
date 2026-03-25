'use client';

import { useTransition } from 'react';
import { updateLeadStatus } from './actions';

interface Props {
    leadId: string;
    currentStatus: string;
}

export default function StatusToggle({ leadId, currentStatus }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = (nextStatus: string) => {
        startTransition(async () => {
            try {
                await updateLeadStatus(leadId, nextStatus);
            } catch (err) {
                alert("Failed to update status. Please try again.");
            }
        });
    };

    return (
        <select
            disabled={isPending}
            value={currentStatus}
            onChange={(e) => handleToggle(e.target.value)}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-all ${
                currentStatus === 'new' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'bg-slate-100 text-slate-400'
            } ${isPending ? 'opacity-50 grayscale' : 'opacity-100'}`}
        >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
        </select>
    );
}