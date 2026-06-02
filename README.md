# MinecraftHosts.net

Fully fixed Cloudflare Workers static asset deployment.

## Folder structure

```text
wrangler.jsonc
package.json
.gitignore
public/
  index.html
  robots.txt
  sitemap.xml
  404.html
  assets/
  reviews/
  compare/
  guides/
```

## Cloudflare settings

Use:

```text
Build command: npm install
Deploy command: npx wrangler deploy
Root directory: /
```

## Important

There is no `_redirects` file in this package.

For `www.minecrafthosts.net`, create the redirect inside Cloudflare Dashboard:

```text
Rules → Redirect Rules
Hostname equals www.minecrafthosts.net
301 redirect to https://minecrafthosts.net
```

## Deploy locally

```bash
git add -A
git commit -m "Fix Cloudflare deployment"
git push origin main
```
