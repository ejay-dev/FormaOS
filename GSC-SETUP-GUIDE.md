# FormaOS Google Search Console Setup Guide

## Step 1 — Add Property

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Click "Add property"
3. Select "URL prefix"
4. Enter: `https://formaos.com.au`
5. Choose verification method: "HTML tag" or "Google Analytics"
6. Copy the verification code
7. Replace `REPLACE_WITH_GSC_VERIFICATION_CODE` in `app/layout.tsx` → `metadata.verification.google`
8. Deploy and verify

## Step 2 — Submit Sitemap

1. In GSC left panel → "Sitemaps"
2. Enter: `sitemap.xml`
3. Click Submit
4. Verify status shows "Success"

## Step 3 — Request Indexing for Key Pages

After verifying, request indexing for these URLs immediately (in order of priority):

1. https://formaos.com.au
2. https://formaos.com.au/ndis-providers
3. https://formaos.com.au/healthcare-compliance
4. https://formaos.com.au/financial-services-compliance
5. https://formaos.com.au/childcare-compliance
6. https://formaos.com.au/construction-compliance
7. https://formaos.com.au/pricing
8. https://formaos.com.au/industries

Use URL Inspection tool → "Request Indexing" for each URL.

## Step 4 — Set Up Performance Monitoring

1. GSC → Performance → Search results
2. Add these as tracked queries:
   - "NDIS compliance software"
   - "healthcare compliance software Australia"
   - "ASIC compliance software"
   - "NQF compliance software"
   - "WHS compliance software"
   - "compliance operating system"
3. Set date range to "Last 28 days"
4. Check weekly

## Step 5 — Connect Google Analytics 4

1. If GA4 not set up: [analytics.google.com](https://analytics.google.com)
2. Create property for formaos.com.au
3. Add GA4 measurement ID to `.env`:
   ```
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. Add GA4 script to `app/layout.tsx`

## Step 6 — Set Up Bing Webmaster Tools

1. Go to [bing.com/webmasters](https://www.bing.com/webmasters)
2. Add site: `https://formaos.com.au`
3. Import from Google Search Console (easiest method)
4. Submit sitemap

## Step 7 — Monitor Monthly

Check these GSC reports monthly:

- **Coverage**: fix any "Excluded" or "Error" pages
- **Core Web Vitals**: fix any "Poor" URLs
- **Mobile Usability**: fix any mobile errors
- **Performance**: track keyword rankings

## SEO Target Keywords (for tracking)

| Priority | Keyword                                          | Target Page                                  |
| -------- | ------------------------------------------------ | -------------------------------------------- |
| P0       | NDIS compliance software                         | /ndis-providers                              |
| P0       | healthcare compliance software Australia         | /healthcare-compliance                       |
| P0       | financial services compliance software Australia | /financial-services-compliance               |
| P0       | childcare compliance software Australia          | /childcare-compliance                        |
| P0       | construction WHS compliance software             | /construction-compliance                     |
| P1       | compliance operating system                      | /                                            |
| P1       | AHPRA compliance tracking                        | /healthcare-compliance                       |
| P1       | ASIC compliance software                         | /financial-services-compliance               |
| P1       | NQF compliance software                          | /childcare-compliance                        |
| P1       | SWMS management software                         | /construction-compliance                     |
| P2       | NDIS practice standards                          | /blog/ndis-practice-standards-complete-guide |
| P2       | NDIS unannounced audit                           | /blog/ndis-unannounced-audits-2026           |
| P2       | AUSTRAC AML CTF compliance                       | /blog/austrac-aml-ctf-compliance-guide       |
