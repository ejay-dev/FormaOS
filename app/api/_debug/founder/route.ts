import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const founderEmailsRaw = process.env.FOUNDER_EMAILS;
  const founderUserIdsRaw = process.env.FOUNDER_USER_IDS;
  
  const emails = (founderEmailsRaw || "").split(",").map(e => e.trim()).filter(Boolean);
  const ids = (founderUserIdsRaw || "").split(",").map(e => e.trim()).filter(Boolean);
  
  return NextResponse.json({
    // Raw values
    FOUNDER_EMAILS_raw: founderEmailsRaw,
    FOUNDER_EMAILS_type: typeof founderEmailsRaw,
    FOUNDER_USER_IDS_raw: founderUserIdsRaw,
    FOUNDER_USER_IDS_type: typeof founderUserIdsRaw,
    
    // Parsed values
    founderEmailsConfigured: Boolean(founderEmailsRaw),
    founderEmailsSize: emails.length,
    founderEmailsArray: emails,
    
    founderUserIdsConfigured: Boolean(founderUserIdsRaw),
    founderUserIdsSize: ids.length,
    founderUserIdsArray: ids.map(id => id.substring(0, 8) + "..."),
    
    // Environment info
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    
    // All env keys with FOUNDER
    allFounderKeys: Object.keys(process.env).filter(k => k.includes('FOUNDER')),
  });
}
