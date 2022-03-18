# jrelease
rewrite of Vercels release

# Changes from Vercel's "Release" (all hail):
- Windows support! (the reason for this package)
- Github device flow authentication, instead of web flow
- Overwrite is gone, don't know why it's necessary?
- "-l" "--list" is here, simply lists all commits since last release, does not change anything
- Gives you the option of creating changelog from the latest active release or from the latest commit tag
- Pre-releases have to be defined as a SemVer-Type (patch, minor, major)
- Use of annotated tags and "push --follow-tags", instead of git push && git push --tags 
