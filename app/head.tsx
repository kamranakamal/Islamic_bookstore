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
      {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} crossOrigin="" /> : null}
      {supabaseOrigin ? <link rel="dns-prefetch" href={supabaseOrigin} /> : null}
    </>
  );
}
