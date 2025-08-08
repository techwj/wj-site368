var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
import HTML from "./638c40f48c4c77a8cd1a79aaeb3e98b1d65b3b2b-index.html";
import robots from "./afd7da21c242f0851d65b65542bbe083d49c5e44-robots.txt";
var SITEMAP_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://today.upalg.com/</loc>
    <lastmod>2025-08-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://today.upalg.com/manifest.json</loc>
    <lastmod>2025-08-07</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
function generateMetaTags(pageData = {}) {
  const baseUrl = "https://today.upalg.com";
  const defaultTitle = "On This Day in History - Explore Historical Events";
  const defaultDescription = "Discover important historical events and notable births that occurred on this day in history. Multi-language support to explore fascinating stories from every day.";
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
      if (path === "/api/onthisday" && request.method === "GET") {
        try {
          const { month, day, lang = "en" } = Object.fromEntries(url.searchParams);
          if (!month || !day) {
            return new Response(JSON.stringify({ error: "Missing month or day parameter" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          const formattedMonth = month.padStart(2, "0");
          const formattedDay = day.padStart(2, "0");
          const birthsApiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/births/${formattedMonth}/${formattedDay}`;
          const eventsApiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/events/${formattedMonth}/${formattedDay}`;
          const apiHeaders = {
            "Api-User-Agent": "OnThisDayApp/1.0 (https://today.upalg.com/contact)",
            "Accept": "application/json"
          };
          if (env.WIKIPEDIA_API_KEY) {
            apiHeaders["Authorization"] = `Bearer ${env.WIKIPEDIA_API_KEY}`;
          }
          console.log("Fetching data from:", { birthsApiUrl, eventsApiUrl, lang, month, day });
          let birthsData = { births: [] };
          let eventsData = { events: [] };
          try {
            const [birthsResponse, eventsResponse] = await Promise.all([
              fetch(birthsApiUrl, { headers: apiHeaders }),
              fetch(eventsApiUrl, { headers: apiHeaders })
            ]);
            console.log("API responses:", {
              birthsStatus: birthsResponse.status,
              eventsStatus: eventsResponse.status,
              birthsOk: birthsResponse.ok,
              eventsOk: eventsResponse.ok
            });
            let birthsErrBody = "";
            let eventsErrBody = "";
            if (!birthsResponse.ok) {
              try {
                birthsErrBody = (await birthsResponse.text()).slice(0, 200);
              } catch {
              }
            }
            if (!eventsResponse.ok) {
              try {
                eventsErrBody = (await eventsResponse.text()).slice(0, 200);
              } catch {
              }
            }
            if (birthsResponse.ok) {
              birthsData = await birthsResponse.json();
              console.log("Births data received:", birthsData.births?.length || 0, "items");
            } else {
              console.warn(`Wikipedia births API error: ${birthsResponse.status} - ${birthsResponse.statusText} - body: ${birthsErrBody}`);
            }
            if (eventsResponse.ok) {
              eventsData = await eventsResponse.json();
              console.log("Events data received:", eventsData.events?.length || 0, "items");
            } else {
              console.warn(`Wikipedia events API error: ${eventsResponse.status} - ${eventsResponse.statusText} - body: ${eventsErrBody}`);
            }
            if (!birthsResponse.ok && !eventsResponse.ok) {
              throw new Error(`Both Wikipedia API requests failed: births(${birthsResponse.status}) body:"${birthsErrBody}" | events(${eventsResponse.status}) body:"${eventsErrBody}"`);
            }
          } catch (error) {
            console.error("Error fetching Wikipedia data:", error);
            throw new Error(`Failed to fetch historical data: ${error.message}`);
          }
          const combinedData = {
            births: birthsData.births || [],
            events: eventsData.events || []
          };
          return new Response(JSON.stringify(combinedData), {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600"
              // Cache for 1 hour
            }
          });
        } catch (error) {
          console.error("OnThisDay API error:", error);
          return new Response(JSON.stringify({
            error: "Failed to fetch historical data",
            details: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } else if (path === "/robots.txt") {
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
            name: "On This Day in History",
            short_name: "This Day",
            description: "Explore historical events and notable births that occurred on this day in history with multi-language support",
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
            categories: ["education", "reference", "history"],
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
        const baseUrl = "https://today.upalg.com";
        const baseDomain = new URL(baseUrl).hostname;
        const currentDomain = originalHost;
        if (baseDomain !== currentDomain) {
          const pageData = {
            title: "On This Day in History - Explore Historical Events",
            description: "Discover important historical events and notable births that occurred on this day in history. Multi-language support to explore fascinating stories.",
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

// .wrangler/tmp/bundle-O1nTON/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-O1nTON/middleware-loader.entry.ts
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
