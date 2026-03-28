import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import sanitizeHtml from 'sanitize-html';
import Link from 'next/link';
import CommunityGallery from '@/components/CommunityGallery';
import ContactForm from '@/components/ContactForm';
import CommunityListings from '@/components/CommunityListings';
import AmenityIcon from '@/components/AmenityIcon';

export const revalidate = 3600;

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = createClient();

    const { data: property } = await supabase
    .from('pm_properties')
    .select(`
        id,
        name,
        slug,
        headline,
        description_html,
        address_display,
        contact_email,
        contact_phone,
        city,
        state_code,
        zip_code,
        beds_range,
        baths_range,
        starting_price,
        property_type,
        hero:pm_media!pm_properties_featured_media_id_fkey (id, file_path),
        pm_posts (id, title, slug, created_at, status),
        pm_gallery (id, sort_order, media:pm_media (file_path, alt_text)),
        pm_property_amenities (
            pm_amenities (
                name,
                icon_slug
            )
        ),
        pm_regions!inner(status)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('pm_regions.status', 'published')
    .single();

    if (!property) notFound();

        const propertyLabel = property.property_type === 'campground' ? 'Resort' : 'Community';

        const publishedPosts = property.pm_posts?.filter((p: any) => p.status === 'published') || [];
        const heroUrl = property.hero
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${(property.hero as any).file_path}`
            : null;
        const galleryImages = property.pm_gallery?.map((item: any) => ({
            id: item.id,
            image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.media?.file_path}`,
            alt_text: item.media?.alt_text
    })) || [];

    const cleanDescriptionHtml = sanitizeHtml(property.description_html || '', {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img', 'br']),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            '*': ['class'],
        },
    });

    const hasAmenities = property?.pm_property_amenities && property.pm_property_amenities.length > 0;
    const navItems = [
        { label: `ABOUT THE ${propertyLabel.toUpperCase()}`, show: true },
        { label: 'AMENITIES', show: hasAmenities },
        { label: 'AVAILABLE UNITS', show: true },
        { label: 'GALLERY', show: galleryImages.length > 0 },
        { label: 'CONTACT FORM', show: true },
    ].filter(item => item.show);

    return (
        <div className="min-h-screen bg-white text-[#0f172a] font-sans leading-relaxed">
            {/* STICKY SUB-NAV */}
            <div className="sticky top-20 z-[90] bg-[#f8fafc] border-b border-slate-200">
                <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center gap-10 overflow-x-auto no-scrollbar">
                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={`#${item.label.toLowerCase().replace(/ /g, '-')}`}
                            className="text-xs font-black tracking-[1px] text-slate-400 hover:text-[#2563eb] transition-colors whitespace-nowrap"
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            </div>

            {/* HERO SECTION */}
            <section
                className="relative bg-slate-900 text-white py-32 lg:py-14 px-8 bg-cover bg-center"
                style={{ backgroundImage: heroUrl ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('${heroUrl}')` : 'none' }}
            >
                <div className="max-w-[1380px] mx-auto">
                    <div className="max-w-[490px] space-y-10 text-left">
                        <div className="space-y-4">
                            <h1 className="text-[3.75rem] font-black tracking-wide leading-[1] capitalize">{property.name}</h1>
                            <p className="text-xl text-blue-400 font-bold uppercase tracking-widest">
                                {property.headline || `Welcome to our ${propertyLabel.toLowerCase()}`}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-8 font-bold uppercase tracking-widest text-sm">
                            <div className="flex items-center gap-4">
                                <AmenityIcon iconPath="brand-assets/amenity-icons/bed-front.svg" className="w-5 h-5 text-white" />
                                <span>{property.beds_range || (property.property_type === 'campground' ? 'RV / Tents  / Cabins' : '2 - 4 Beds')}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <AmenityIcon iconPath="brand-assets/amenity-icons/bath-icon.svg" className="w-5 h-5 text-white" />
                                <span>{property.baths_range || '1 - 2 Baths'}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <AmenityIcon iconPath="brand-assets/amenity-icons/badge-dollar.svg" className="w-5 h-5 text-white" />
                                <span>{property.starting_price}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <main className="max-w-[1440px] mx-auto px-8 py-24 space-y-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
                    <div className="lg:col-span-2 space-y-32">
                        {/* ABOUT */}
                        <section id={navItems[0].label.toLowerCase().replace(/ /g, '-')} className="scroll-mt-48">
                            <h2 className="text-[2.18rem] font-bold text-[#333333] uppercase tracking-tight mb-8">About Our {propertyLabel}</h2>
                            {cleanDescriptionHtml ? (
                                <div
                                    className="prose prose-slate max-w-none text-[#0f172a] text-lg leading-[1.8]"
                                    dangerouslySetInnerHTML={{ __html: cleanDescriptionHtml }}
                                />
                            ) : (
                                <p className="text-slate-400 text-lg">Information coming soon.</p>
                            )}
                        </section>

                        {/* AMENITIES */}
                        {hasAmenities && (
                            <section id="amenities" className="scroll-mt-24 border-t pt-24 border-slate-100">
                                <h2 className="text-[2.18rem] font-bold text-[#333333] mb-12 uppercase tracking-tight">Amenities</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
                                    {property.pm_property_amenities.map((item: any) => (
                                        <div key={item.pm_amenities.name} className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                                <AmenityIcon
                                                    iconPath={item.pm_amenities.icon_slug}
                                                    className="w-6 h-6 text-[#2563eb]"
                                                />
                                            </div>
                                            <p className="text-sm font-bold uppercase tracking-widest text-[#333333]">{item.pm_amenities.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* SIDEBAR */}
                    <div className="space-y-12">
                        {/* BLOG POSTS */}
                        {publishedPosts.length > 0 && (
                            <section className="bg-[#f8fafc] p-12 rounded-[1rem] border border-slate-100 shadow-sm">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 border-b border-slate-200 pb-4">
                                    Property Updates
                                </h3>
                                <div className="space-y-10">
                                    {publishedPosts.map((post: any) => (
                                        <Link
                                            href={`/properties/${property.slug}/posts/${post.slug}`}
                                            key={post.id}
                                            className="block group"
                                        >
                                            <h4 className="font-bold text-[25px] text-[#333333] group-hover:text-[#2563eb] transition-colors leading-tight mb-2">
                                                {post.title}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="p-12 border-l-8 border-[#f8fafc] space-y-8">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Location & Details</h3>
                                <div className="space-y-2">
                                    <p className="text-[#333333] font-bold text-2xl tracking-tighter leading-tight">{property.address_display}</p>
                                    <p className="text-slate-500 font-medium text-lg italic">{property.city}, {property.state_code} {property.zip_code}</p>
                                </div>
                            </div>
                            <div className="pt-8 border-t border-slate-100 space-y-4">
                                {property.contact_phone && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-[#2563eb]"></span>
                                        <a href={`tel:${property.contact_phone}`} className="font-bold text-[#333333] hover:text-blue-600 transition-colors">{property.contact_phone}</a>
                                    </div>
                                )}
                                {property.contact_email && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-[#2563eb]"></span>
                                        <a href={`mailto:${property.contact_email}`} className="font-bold text-[#333333] hover:text-blue-600 transition-colors truncate">{property.contact_email}</a>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* LISTINGS */}
                <section id="available-units" className="scroll-mt-24 border-t pt-24 border-slate-100">
                    <h2 className="text-[2.18rem] font-bold text-[#333333] mb-12 uppercase tracking-tight text-center">
                        Available Units
                    </h2>
                    <Suspense fallback={
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
                            {[1, 2, 3].map((i) => <div key={i}
                            className="h-64 bg-slate-50 animate-pulse rounded-[1rem] border border-slate-100" />
                        )}
                        </div>}>
                        <CommunityListings city={property.city} />
                    </Suspense>
                </section>

                {/* GALLERY */}
                {galleryImages.length > 0 && (
                    <section id="gallery" className="scroll-mt-24 border-t pt-24 border-slate-100 pb-20 text-center">
                        <h2 className="text-[2.18rem] font-bold text-[#333333] mb-12 uppercase tracking-tight">Photo Gallery</h2>
                        <CommunityGallery images={galleryImages} />
                    </section>
                )}

                {/* CONTACT */}
                <section id="contact-form" className="scroll-mt-24 border-t pt-24 border-slate-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                        <div className="space-y-6">
                            <h2 className="text-[2.18rem] font-bold text-[#333333] uppercase tracking-tight">
                                Interested in {property.name}?
                            </h2>
                            <p className="text-lg text-slate-500 leading-relaxed">
                                Fill out the form and a member of our regional team will be in touch to answer your questions and help you find the right home.
                            </p>
                            <div className="space-y-3 pt-4">
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs">✓</span>
                                    No commitment required
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs">✓</span>
                                    Fast response from local team
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs">✓</span>
                                    Schedule a tour at your convenience
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#f8fafc] p-10 rounded-[1rem] border border-slate-100 shadow-sm">
                            <ContactForm
                                propertyId={property.id}
                                propertyName={property.name}
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}