# /public/team — founder + team headshots

Marketing pages reference photos from this directory.

## Currently referenced

- `founder.jpeg` — Ejaz Hussain, Founder & Chief Engineer
  - Used by [`AboutPageContent.tsx`](../../app/(marketing)/about/AboutPageContent.tsx) (founder origin-story card, 280×400 portrait crop) and [`StoryPageContentNew.tsx`](../../app/(marketing)/our-story/StoryPageContentNew.tsx) (64×64 circular avatar under the founder quote).
  - Both pages also have an `onError` fallback that hides the `<img>` and reveals an "EH" initials placeholder — so if this file ever 404s the page still renders cleanly.

## If you switch formats

Update both `src="/team/founder.jpeg"` references in the two pages above to match.
