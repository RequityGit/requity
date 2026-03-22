'use client';

import { useState, useMemo } from 'react';
import AmenityIcon from '@/components/AmenityIcon';

const ICON_PREFIX = 'brand-assets/amenity-icons/';

interface Amenity {
    id: string;
    name: string;
    icon_slug: string;
}

interface AmenityPickerProps {
    allAmenities: Amenity[];
    selectedIds: string[];
    onConfirm: (ids: string[]) => Promise<void>;
    maxSelection?: number;
}

export default function AmenityPicker({ allAmenities, selectedIds, onConfirm, maxSelection = 12 }: AmenityPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
    const [saving, setSaving] = useState(false);

    const safeAmenities = useMemo(() =>
        allAmenities.filter(a =>
            typeof a.icon_slug === 'string' && a.icon_slug.startsWith(ICON_PREFIX)
        ), [allAmenities]
    );

    const toggle = (id: string) => {
        setLocalSelected(prev => {
            if (prev.includes(id)) return prev.filter(i => i !== id);
            if (prev.length >= maxSelection) return prev; // silently cap
            return [...prev, id];
        });
    };

    const handleConfirm = async () => {
        setSaving(true);
        await onConfirm(localSelected);
        setSaving(false);
        setIsOpen(false);
    };

    const handleOpen = () => {
        setLocalSelected(selectedIds);
        setIsOpen(true);
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleOpen}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-[10px] uppercase hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
                {selectedIds.length > 0 ? `${selectedIds.length} Selected • Edit` : 'Assign Amenities'}
            </button>

            {/* Preview chips */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {safeAmenities
                        .filter(a => selectedIds.includes(a.id))
                        .map(a => (
                            <span key={a.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-[10px] font-bold text-blue-700 tracking-widest">
                                <AmenityIcon iconPath={a.icon_slug} className="w-3 h-3 text-blue-600" />
                                {a.name}
                            </span>
                        ))}
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[1rem] shadow-2xl flex flex-col overflow-hidden">
                        <header className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Amenities</h2>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                                    localSelected.length >= maxSelection ? 'text-amber-500' : 'text-slate-400'
                                }`}>
                                    {localSelected.length}/{maxSelection} selected
                                    {localSelected.length >= maxSelection && ' — limit reached'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-900"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </header>

                        <div className="p-8 space-y-2 overflow-y-auto max-h-[50vh]">
                            {safeAmenities.map(amenity => {
                                const checked = localSelected.includes(amenity.id);
                                const atLimit = localSelected.length >= maxSelection && !checked;
                                return (
                                    <label
                                        key={amenity.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors
                                            ${checked ? 'bg-blue-50 border border-blue-100' : 'border border-slate-100'}
                                            ${atLimit ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggle(amenity.id)}
                                            disabled={atLimit}
                                            className="accent-blue-600"
                                        />
                                        <AmenityIcon
                                            iconPath={amenity.icon_slug}
                                            className={`w-5 h-5 ${checked ? 'text-blue-600' : 'text-slate-400'}`}
                                        />
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                                            {amenity.name}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="p-8 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : `Confirm (${localSelected.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}