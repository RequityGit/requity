const LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#081525]">
      <img
        src={LOGO_URL}
        alt="Requity Group"
        className="h-12 w-auto"
      />
      <p className="mt-4 text-sm text-white/40">Coming soon.</p>
    </main>
  );
}
