# MinecraftHosts.net

Static Minecraft server hosting comparison site deployed with Cloudflare Workers static assets.

## Cloudflare deploy settings

Use:

```text
Build command: npm install
Deploy command: npx wrangler deploy
```

Wrangler serves files from:

```text
public/
```

## Important

Do not add a `www` redirect inside `_redirects` for Workers static assets. Cloudflare Workers only accepts relative redirect paths there.

Create the `www.minecrafthosts.net` redirect in Cloudflare:

```text
Rules → Redirect Rules → Create Rule
Hostname equals www.minecrafthosts.net
301 redirect to https://minecrafthosts.net/$1
```
