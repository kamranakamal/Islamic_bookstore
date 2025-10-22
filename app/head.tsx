const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

let supabaseOrigin: string | null = null;
if (supabaseUrl) {
  try {
    supabaseOrigin = new URL(supabaseUrl).origin;
  } catch {
    supabaseOrigin = null;
  }
}

export default function Head() {
  return (
    <>
      <meta name="theme-color" content="#0F766E" />
      <meta name="format-detection" content="telephone=yes,address=yes,email=yes" />
      
      {/* Favicon links */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
      <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} crossOrigin="" /> : null}
      {supabaseOrigin ? <link rel="dns-prefetch" href={supabaseOrigin} /> : null}
    </>
  );
}
