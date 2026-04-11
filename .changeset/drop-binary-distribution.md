---
"@charcoalhq/cli": patch
---

Drop standalone binary distribution. Prebuilt binaries produced by `bun build --compile` are unsigned, and on Apple Silicon macOS the kernel refuses to load arm64 binaries without even an ad-hoc signature, so the binaries we were attaching to GitHub releases were broken for every macOS user. Rather than maintain a codesigning pipeline, the CLI is now distributed exclusively via npm (`npm install -g @charcoalhq/cli`), which works on any platform with Node.js 20+.
