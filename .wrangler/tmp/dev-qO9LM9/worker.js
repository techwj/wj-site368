var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
import HTML from "./910a111bc08d048ab95438c9c982781f0936d1c4-index.html";
import robots from "./d21b592079413f2fe4d5bcce47e8a23b6045e4c4-robots.txt";
var SITEMAP_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://img.upalg.com.com/</loc>
    <lastmod>2025-01-27</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://img.upalg.com.com/manifest.json</loc>
    <lastmod>2025-01-27</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
function generateMetaTags(pageData = {}) {
  const baseUrl = "https://img.upalg.com.com";
  const defaultTitle = "Free AI Image Generator - Text to Image Tool";
  const defaultDescription = "Create stunning AI-generated images from text prompts. Free online tool powered by Stable Diffusion XL, FLUX.1, and DreamShaper models.";
  const title = pageData.title || defaultTitle;
  const description = pageData.description || defaultDescription;
  const url = pageData.url || baseUrl;
  const canonical = pageData.canonical || baseUrl;
  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <link rel="canonical" href="${canonical}">
  `;
}
__name(generateMetaTags, "generateMetaTags");
function generateETag(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = crypto.subtle.digestSync("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `"${hashHex.substring(0, 16)}"`;
}
__name(generateETag, "generateETag");
var CACHE_CONFIG = {
  html: {
    maxAge: 3600,
    // 1小时
    cacheControl: "public, max-age=3600, stale-while-revalidate=86400"
  },
  static: {
    maxAge: 86400,
    // 24小时
    cacheControl: "public, max-age=86400, immutable"
  },
  api: {
    maxAge: 300,
    // 5分钟
    cacheControl: "public, max-age=300"
  },
  images: {
    maxAge: 604800,
    // 7天
    cacheControl: "public, max-age=604800, immutable"
  }
};
function getCacheHeaders(content, type = "html") {
  const config = CACHE_CONFIG[type] || CACHE_CONFIG.html;
  const etag = generateETag(content);
  return {
    "Cache-Control": config.cacheControl,
    ETag: etag,
    "Last-Modified": (/* @__PURE__ */ new Date()).toUTCString(),
    Vary: "Accept-Encoding"
  };
}
__name(getCacheHeaders, "getCacheHeaders");
var AVAILABLE_MODELS = [
  {
    id: "stable-diffusion-xl-base-1.0",
    name: "Stable Diffusion XL Base 1.0",
    description: "SDXL Base model",
    key: "@cf/stabilityai/stable-diffusion-xl-base-1.0"
  },
  {
    id: "flux-1-schnell",
    name: "FLUX.1 [schnell]",
    description: "High-performance model",
    key: "@cf/black-forest-labs/flux-1-schnell"
  },
  {
    id: "dreamshaper-8-lcm",
    name: "DreamShaper 8 LCM",
    description: "Photorealistic model",
    key: "@cf/lykon/dreamshaper-8-lcm"
  },
  {
    id: "stable-diffusion-xl-lightning",
    name: "Stable Diffusion XL Lightning",
    description: "Fast generation",
    key: "@cf/bytedance/stable-diffusion-xl-lightning"
  }
];
var RANDOM_PROMPTS = [
  "cyberpunk cat samurai graphic art, blood splattered, beautiful colors",
  "1girl, solo, outdoors, camping, night, mountains, nature, stars, moon, tent, twin ponytails, green eyes, cheerful, happy, backpack, sleeping bag, camping stove, water bottle, mountain boots, gloves, sweater, hat, flashlight,forest, rocks, river, wood, smoke, shadows, contrast, clear sky, constellations, Milky Way",
  "masterpiece, best quality, amazing quality, very aesthetic, high resolution, ultra-detailed, absurdres, newest, scenery, anime, anime coloring, (dappled sunlight:1.2), rim light, backlit, dramatic shadow, 1girl, long blonde hair, blue eyes, shiny eyes, parted lips, medium breasts, puffy sleeve white dress, forest, flowers, white butterfly, looking at viewer",
  "frost_glass, masterpiece, best quality, absurdres, cute girl wearing red Christmas dress, holding small reindeer, hug, braided ponytail, sidelocks, hairclip, hair ornaments, green eyes, (snowy forest, moonlight, Christmas trees), (sparkles, sparkling clothes), frosted, snow, aurora, moon, night, sharp focus, highly detailed, abstract, flowing",
  "1girl, hatsune miku, white pupils, power elements, microphone, vibrant blue color palette, abstract,abstract background, dreamlike atmosphere, delicate linework, wind-swept hair, energy, masterpiece, best quality, amazing quality",
  "cyberpunk cat(neon lights:1.3) clutter,ultra detailed, ctrash, chaotic, low light, contrast, dark, rain ,at night ,cinematic , dystopic, broken ground, tunnels, skyscrapers",
  "Cyberpunk catgirl with purple hair, wearing leather and latex outfit with pink and purple cheetah print, holding a hand gun, black latex brassiere, glowing blue eyes with purple tech sunglasses, tail, large breasts, glowing techwear clothes, handguns, black leather jacket, tight shiny leather pants, cyberpunk alley background, Cyb3rWar3, Cyberware",
  "a wide aerial view of a floating elven city in the sky, with two elven figures walking side by side across a glowing skybridge, the bridge arching between tall crystal towers, surrounded by clouds and golden light, majestic and serene atmosphere, vivid style, magical fantasy architecture",
  "masterpiece, newest, absurdres,incredibly absurdres, best quality, amazing quality, very aesthetic, 1girl, very long hair, blonde, multi-tied hair, center-flap bangs, sunset, cumulonimbus cloud, old tree,sitting in tree, dark blue track suit, adidas, simple bird",
  "beautiful girl, breasts, curvy, looking down scope, looking away from viewer, laying on the ground, laying ontop of jacket, aiming a sniper rifle, dark braided hair, backwards hat, armor, sleeveless, arm sleeve tattoos, muscle tone, dogtags, sweaty, foreshortening, depth of field, at night, night, alpine, lightly snowing, dusting of snow, Closeup, detailed face, freckles"
];
var PASSWORDS = [];
var worker_default = {
  async fetch(request, env) {
    const originalHost = request.headers.get("host");
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      if (path === "/api/models") {
        return new Response(JSON.stringify(AVAILABLE_MODELS), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } else if (path === "/api/prompts") {
        return new Response(JSON.stringify(RANDOM_PROMPTS), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } else if (path === "/api/generate" && request.method === "POST") {
        const data = await request.json();
        if (PASSWORDS.length > 0 && (!data.password || !PASSWORDS.includes(data.password))) {
          return new Response(JSON.stringify({ error: "Please enter the correct password" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        if ("prompt" in data && "model" in data) {
          const selectedModel = AVAILABLE_MODELS.find((m) => m.id === data.model);
          if (!selectedModel) {
            return new Response(JSON.stringify({ error: "Model is invalid" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          const model = selectedModel.key;
          let inputs = {};
          if (data.model === "flux-1-schnell") {
            let steps = data.num_steps || 6;
            if (steps >= 8) steps = 8;
            else if (steps <= 4) steps = 4;
            inputs = {
              prompt: data.prompt || "cyberpunk cat",
              steps
            };
          } else {
            inputs = {
              prompt: data.prompt || "cyberpunk cat",
              negative_prompt: data.negative_prompt || "",
              height: data.height || 1024,
              width: data.width || 1024,
              num_steps: data.num_steps || 20,
              strength: data.strength || 0.1,
              guidance: data.guidance || 7.5,
              seed: data.seed || parseInt((Math.random() * 1024 * 1024).toString(), 10)
            };
          }
          console.log(`Generating image with ${model} and prompt: ${inputs.prompt.substring(0, 50)}...`);
          try {
            const response = await env.AI.run(model, inputs);
            if (data.model === "flux-1-schnell") {
              let jsonResponse;
              if (typeof response === "object") {
                jsonResponse = response;
              } else {
                try {
                  jsonResponse = JSON.parse(response);
                } catch (e) {
                  console.error("Failed to parse JSON response:", e);
                  return new Response(
                    JSON.stringify({
                      error: "Failed to parse response",
                      details: e.message
                    }),
                    {
                      status: 500,
                      headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                  );
                }
              }
              if (!jsonResponse.image) {
                return new Response(
                  JSON.stringify({
                    error: "Invalid response format",
                    details: "Image data not found in response"
                  }),
                  {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                  }
                );
              }
              try {
                const binaryString = atob(jsonResponse.image);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                return new Response(bytes, {
                  headers: {
                    ...corsHeaders,
                    "content-type": "image/png"
                  }
                });
              } catch (e) {
                console.error("Failed to convert base64 to binary:", e);
                return new Response(
                  JSON.stringify({
                    error: "Failed to process image data",
                    details: e.message
                  }),
                  {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                  }
                );
              }
            } else {
              return new Response(response, {
                headers: {
                  ...corsHeaders,
                  "content-type": "image/png"
                }
              });
            }
          } catch (aiError) {
            console.error("AI generation error:", aiError);
            return new Response(
              JSON.stringify({
                error: "Image generation failed",
                details: aiError.message
              }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              }
            );
          }
        } else {
          return new Response(JSON.stringify({ error: "Missing required parameter: prompt or model" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } else if (path === "/robots.txt") {
        console.log("robots.txt>>>");
        const cacheHeaders = getCacheHeaders(robots, "static");
        return new Response(robots, {
          status: 200,
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            "content-type": "text/plain"
          }
        });
      } else if (path === "/sitemap.xml") {
        const cacheHeaders = getCacheHeaders(SITEMAP_CONTENT, "static");
        return new Response(SITEMAP_CONTENT, {
          status: 200,
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            "content-type": "application/xml"
          }
        });
      } else if (path === "/manifest.json") {
        const manifestContent = JSON.stringify(
          {
            name: "AI Image Generator",
            short_name: "AI Image Gen",
            description: "Free AI image generation tool powered by Cloudflare Workers",
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#5046e5",
            orientation: "portrait-primary",
            scope: "/",
            lang: "en",
            icons: [
              {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable"
              },
              {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable"
              }
            ],
            categories: ["productivity", "utilities", "photo"],
            screenshots: [
              {
                src: "/screenshot-wide.png",
                sizes: "1280x720",
                type: "image/png",
                form_factor: "wide"
              },
              {
                src: "/screenshot-narrow.png",
                sizes: "750x1334",
                type: "image/png",
                form_factor: "narrow"
              }
            ]
          },
          null,
          2
        );
        const cacheHeaders = getCacheHeaders(manifestContent, "static");
        return new Response(manifestContent, {
          status: 200,
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            "content-type": "application/json"
          }
        });
      } else if (request.method === "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else if (path.endsWith(".html") || path === "/") {
        let processedHTML = HTML.replace(/{{host}}/g, originalHost);
        const baseUrl = "https://img.upalg.com.com";
        const baseDomain = new URL(baseUrl).hostname;
        const currentDomain = originalHost;
        if (baseDomain !== currentDomain) {
          const pageData = {
            title: "Free AI Image Generator - Text to Image Tool",
            description: "Create stunning AI-generated images from text prompts. Free online tool powered by Stable Diffusion XL, FLUX.1, and DreamShaper models.",
            url: `https://${originalHost}`,
            canonical: `https://${originalHost}/`
          };
          const dynamicMetaTags = generateMetaTags(pageData);
          processedHTML = processedHTML.replace(/<title>.*?<\/title>/s, dynamicMetaTags);
        }
        const cacheHeaders = getCacheHeaders(processedHTML, "html");
        return new Response(processedHTML, {
          status: 200,
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            "content-type": "text/html"
          }
        });
      } else {
        return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-XoW9D4/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-XoW9D4/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
