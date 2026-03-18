Marketing background assets are stored locally so the public site does not
depend on third-party CDNs at runtime.

Current rules

- Marketing pages use photos only. Video backgrounds were removed.
- Each routed marketing page receives one dedicated image and that image is not
  reused by any other routed marketing page.
- Images were downloaded from public Unsplash results and compressed locally for
  low-opacity hero/backdrop use.

Asset notes

- Files in this folder follow the route names used by
  `lib/marketing/background-media.ts`.
- Images are resized and compressed for smooth rendering on Vercel while still
  retaining high-resolution source detail for full-width backdrops.
