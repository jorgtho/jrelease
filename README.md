# jrelease
rewrite of Vercels release

# Changes from Vercel's "Release" (all hail):
- Windows support! (the reason for this package)
- Github device flow authentication, instead of web flow (which doesn't seem to be working with Vercel's version anymore?)
- Overwrite is gone, don't know why it's necessary?
- "-l" "--list" is here, simply lists all commits since latest stable release, does not change anything
- Gives you the option of creating changelog from the latest stable release or from the latest pre-release (if the pre-release is newer than the latest stable release)
- Pre-releases are not defined as a flag anymore but as semver type (prepatch, preminor, premajor, or simply pre - to increase a pre-release version)
- Use of annotated tags and "push --follow-tags", instead of git push && git push --tags (doesn't push all your local tags to remote, only annotated - read more in some link I will put here)
- Might be some extra stuff I did drunk - will be a surprise for everybody (even myself)

# Usage
will write sometime