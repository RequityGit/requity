import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

export const revalidate = 3600;

// reserved for system folders
const RESERVED_SLUGS = [
    'login', 
    'admin', 
    'api', 
    'communities', // legacy, kept for safety for now
    'properties',  
    'campgrounds', 
    'for-sale',
    'about',
    'contact'
];

export default async function StaticPage({ params }: { params: Promise<{ pageSlug: string }> }) {
    const { pageSlug } = await params;
    if (RESERVED_SLUGS.includes(pageSlug.toLowerCase())) {
        notFound();
    }
    const supabase = createClient();
    const { data: page, error } = await supabase
        .from('pm_pages')
        .select('title, content_html, hero_image_id')
        .eq('slug', pageSlug)
        .single();
    
    if (error || !page) notFound();
    // sanitize on the server before rendering to the user
    const cleanHTML = sanitizeHtml(page.content_html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'span' ]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            '*': ['class'],
            'img': ['src', 'alt', 'width', 'height']
        }
    });

    return (
            <main className="min-h-screen bg-white max-w-[1440px] mx-auto px-8 py-24 font-sans">
                <header className="mb-16 border-l-8 border-[#2563eb] pl-8">
                    <h1 className="text-[3.75rem] font-black text-[#333333] leading-none">
                        {page.title}
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
                    {/* Main Content */}
                    <article 
                        className="lg:col-span-2 prose prose-xl prose-slate max-w-none 
                                   prose-headings:text-[#333333] prose-headings:font-black
                                   prose-p:text-[#0f172a] prose-p:leading-[1.8]
                                   prose-strong:text-[#2563eb]"
                        dangerouslySetInnerHTML={{ __html: cleanHTML }} 
                    />
                    {/* Sidebar / Sidebar CTA */}
                    <aside className="lg:col-span-1">
                        <div className="bg-[#f8fafc] p-10 rounded-[1rem] border border-slate-100 sticky top-32">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Need Assistance?
                            </h3>
                            <p className="text-[#0f172a] font-bold mb-8 text-lg">
                                Our regional team is here to help you find the perfect community.
                                </p>
                            <a href="mailto:hello@trgliving.com" className="block text-center bg-[#2563eb] text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-colors">
                                Email Us
                            </a>
                        </div>
                    </aside>
                </div>
            </main>
    );
}