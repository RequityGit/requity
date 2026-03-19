export default function AmenityIcon({ iconPath, className }: { iconPath: string, className?: string }) {
    if (!iconPath) return null;

    // Construct the public storage URL
    const iconUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${iconPath}`;

    return (
        <div 
            className={`${className} bg-current`} 
            style={{
                maskImage: `url('${iconUrl}')`,
                WebkitMaskImage: `url('${iconUrl}')`,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskSize: 'contain'
            }}
            aria-hidden="true"
        />
    );
}