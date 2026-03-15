'use client';
import { useState } from 'react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface GalleryImage {
    id: string;
    image_url: string;
    alt_text?: string;
}

export default function CommunityGallery({ images }: { images: GalleryImage[] }) {
    const [index, setIndex] = useState(-1);

    if (!images || images.length === 0) return null;

    // Format images for the Lightbox library
    const slides = images.map((img) => ({
        src: img.image_url,
        alt: img.alt_text || 'Property Image',
    }));

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Photo Gallery</h2>
                <div className="h-px bg-slate-100 flex-1"></div>
            </div>
        
        {/* The Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, i) => (
                <button
                key={img.id}
                onClick={() => setIndex(i)}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 transition-all hover:shadow-lg"
                >
                    <img
                        src={img.image_url}
                        alt={img.alt_text || 'Gallery Image'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-bold text-xs uppercase tracking-widest">Zoom +</span>
                    </div>
                </button>
            ))}
        </div>
        {/* The Lightbox */}
        <Lightbox
            index={index}
            open={index >= 0}
            close={() => setIndex(-1)}
            slides={slides}
        />    
        </section>
    );
}