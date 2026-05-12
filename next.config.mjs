/** @type {import('next').NextConfig} */
function supabaseStorageRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const u = new URL(raw);
    return [
      {
        protocol: u.protocol.replace(":", ""),
        hostname: u.hostname,
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const remotePatterns = supabaseStorageRemotePatterns();

// Fallback when env is missing at build time (e.g. CI without secrets)
if (remotePatterns.length === 0) {
  remotePatterns.push({
    protocol: "https",
    hostname: "zoaweremvyknjigtremn.supabase.co",
    port: "",
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
