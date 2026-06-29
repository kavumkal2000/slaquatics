# Media Source Staging

R2 is the active store for site media. Do not commit CDN image or video binaries to this repository.

When media needs to be replaced or added, temporarily place files in:

- `media-source/images/`
- `media-source/videos/`

Then run the R2 publisher. The staging folders and generated manifest are ignored by git.
