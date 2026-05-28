# /public/team — founder + team headshots

Marketing pages reference photos from this directory.

## Currently referenced

- `founder.jpg` — Ejaz Hussain, Founder & Chief Engineer
  - Used by [`AboutPageContent.tsx`](../../app/(marketing)/about/AboutPageContent.tsx) (founder origin-story card, 280×400 portrait crop) and [`StoryPageContentNew.tsx`](../../app/(marketing)/our-story/StoryPageContentNew.tsx) (64×64 circular avatar under the founder quote).
  - **Until the binary is uploaded, both pages render cleanly** thanks to an `onError` fallback that hides the `<img>` and reveals an "EH" initials placeholder underneath.

## When you upload the real photo

Save the binary as `public/team/founder.jpg`. Aspect ratio ~7:10 (portrait) works best for the /about card; the /our-story avatar takes the centre of any crop. Both pages auto-pick up the photo once the file is in place — no JSX change needed.

If you switch formats (e.g. `.webp` or `.png`), update both `src="/team/founder.jpg"` references in the two pages above to match.
