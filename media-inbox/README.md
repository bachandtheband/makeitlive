# media-inbox (local only)

Put your **original** photos and videos here. Everything in this folder except this file is ignored by git,
so large raw files never end up on GitHub or on the website.

```
media-inbox/
  photos/
    general/  dj/  live-musicians/  live-bands/  performers/  photo-video/  team/
  video/        ← raw clips; see the "Photos & video" section in ../README.md for the ffmpeg commands
```

Then run `./scripts/optimize-photos.sh` from the project folder. It writes web-ready WebP files (max 2000 px,
location data stripped) into `assets/photos/<same-folder>/`.
