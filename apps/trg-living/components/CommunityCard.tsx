import Image from 'next/image';
import Link from 'next/link';

interface CommunityCardProps {
    community: {
        id: string;
        name: string;
        slug: string;
        city: string;
        state_code: string;
        featured_media?: { file_path: string } | null;
    };
}

export default function CommunityCard({ community }: CommunityCardProps) {
    const imageUrl = community.featured_media?.file_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${community.featured_media.file_path}`
        : null;

    return (
        <Link
            href={`/communities/${community.slug}`}
            className="group block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all overflow-hidden"
        >
            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={community.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                        {community.name}
                    </div>
                )}
            </div>
            <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {community.name}
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                    {community.city}{community.state_code ? `, ${community.state_code}` : ''}
                </p>
                <div className="mt-6 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-blue-600">
                    View Community Details
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
            </div>
        </Link>
    );
}