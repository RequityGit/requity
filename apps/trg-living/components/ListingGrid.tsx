import Image from 'next/image';

interface Listing {
    uid: string;
    title: string;
    address: string;
    rent: string;
    image: string;
    detailUrl: string;
    applyUrl: string;
}

export default function ListingGrid({ listings }: { listings: Listing[] }) {
    if (!listings || listings.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[1rem]">
                <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest">
                    No vacancies at this community today.
                </p>
            </div>
        );
    }

    return ( 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((item) => (
                <div key={item.uid} className="bg-white rounded-[1rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all group">
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <Image
                            src={item.image || '/placeholder-house.jpg'}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-sm font-black text-[#0f172a] shadow-sm">
                                {item.rent}
                            </span>
                        </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-8 space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-[#333333] leading-tight line-clamp-1">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                {item.address}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <a
                                href={item.detailUrl}
                                rel="noopener noreferrer"
                                className="flex items-center justify-center py-3 border-2 border-slate-900 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                                >
                                    Details
                                </a>
                            <a
                                href={item.applyUrl}
                                rel="noopener noreferrer"
                                className="flex items-center justify-center py-3 bg-[#2563eb] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                Apply Now
                            </a>
                        </div>
                    </div>
                </div>                
            ))}
        </div>
    );
}