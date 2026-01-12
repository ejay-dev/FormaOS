// Simple debug endpoint - no imports, no complexity
export const runtime = "edge";

export async function GET(request: Request) {
  const founderEmailsRaw = process.env.FOUNDER_EMAILS;
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString(),
    
    // Critical check
    FOUNDER_EMAILS: founderEmailsRaw,
    has_FOUNDER_EMAILS: Boolean(founderEmailsRaw),
    type_FOUNDER_EMAILS: typeof founderEmailsRaw,
    
    // Environment
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    
    // All env keys with FOUNDER
    all_keys_with_FOUNDER: Object.keys(process.env).filter(k => k.toUpperCase().includes('FOUNDER')),
    
    // Request info
    url: request.url,
    host: new URL(request.url).host,
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
