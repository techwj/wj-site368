
// import html template
import HTML from "./public/index.html";
import robots from "./public/robots.txt";

// Sitemap content
const SITEMAP_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
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


// 动态生成meta标签功能
function generateMetaTags(pageData = {}) {
  const baseUrl = "https://today.upalg.com";
  const defaultTitle = "On This Day in History - Explore Historical Events";
  const defaultDescription =
    "Discover important historical events and notable births that occurred on this day in history. Multi-language support to explore fascinating stories from every day.";

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

// 生成ETag用于缓存
function generateETag(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = crypto.subtle.digestSync("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `"${hashHex.substring(0, 16)}"`;
}

// 缓存策略配置
const CACHE_CONFIG = {
  html: {
    maxAge: 3600, // 1小时
    cacheControl: "public, max-age=3600, stale-while-revalidate=86400",
  },
  static: {
    maxAge: 86400, // 24小时
    cacheControl: "public, max-age=86400, immutable",
  },
  api: {
    maxAge: 300, // 5分钟
    cacheControl: "public, max-age=300",
  },
  images: {
    maxAge: 604800, // 7天
    cacheControl: "public, max-age=604800, immutable",
  },
};

// 获取缓存头
function getCacheHeaders(content, type = "html") {
  const config = CACHE_CONFIG[type] || CACHE_CONFIG.html;
  const etag = generateETag(content);

  return {
    "Cache-Control": config.cacheControl,
    ETag: etag,
    "Last-Modified": new Date().toUTCString(),
    Vary: "Accept-Encoding",
  };
}


export default {
  async fetch(request, env) {
    const originalHost = request.headers.get("host");

    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/api/onthisday" && request.method === "GET") {
        // Get historical events from Wikipedia
        try {
          const { month, day, lang = 'en' } = Object.fromEntries(url.searchParams);
          
          if (!month || !day) {
            return new Response(JSON.stringify({ error: "Missing month or day parameter" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Format month and day with leading zeros
          const formattedMonth = month.padStart(2, '0');
          const formattedDay = day.padStart(2, '0');
          
          // Wikipedia API URLs for births and events
          const birthsApiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/births/${formattedMonth}/${formattedDay}`;
          const eventsApiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/events/${formattedMonth}/${formattedDay}`;

          // Build request headers per Wikimedia docs
          const apiHeaders = {
            'Api-User-Agent': 'OnThisDayApp/1.0 (https://today.upalg.com/contact)',
            'Accept': 'application/json',
          };
          if (env.WIKIPEDIA_API_KEY) {
            apiHeaders['Authorization'] = `Bearer ${env.WIKIPEDIA_API_KEY}`;
          }
          
          console.log('Fetching data from:', { birthsApiUrl, eventsApiUrl, lang, month, day });
          
          // Fetch both births and events data
          let birthsData = { births: [] };
          let eventsData = { events: [] };
          
          try {
            const [birthsResponse, eventsResponse] = await Promise.all([
              fetch(birthsApiUrl, { headers: apiHeaders }),
              fetch(eventsApiUrl, { headers: apiHeaders })
            ]);
            
            console.log('API responses:', {
              birthsStatus: birthsResponse.status,
              eventsStatus: eventsResponse.status,
              birthsOk: birthsResponse.ok,
              eventsOk: eventsResponse.ok
            });
            // Log brief error bodies when not OK (to aid diagnosis)
            let birthsErrBody = '';
            let eventsErrBody = '';
            if (!birthsResponse.ok) {
              try { birthsErrBody = (await birthsResponse.text()).slice(0, 200); } catch {}
            }
            if (!eventsResponse.ok) {
              try { eventsErrBody = (await eventsResponse.text()).slice(0, 200); } catch {}
            }
            
            // Handle births response
            if (birthsResponse.ok) {
              birthsData = await birthsResponse.json();
              console.log('Births data received:', birthsData.births?.length || 0, 'items');
            } else {
              console.warn(`Wikipedia births API error: ${birthsResponse.status} - ${birthsResponse.statusText} - body: ${birthsErrBody}`);
            }
            
            // Handle events response
            if (eventsResponse.ok) {
              eventsData = await eventsResponse.json();
              console.log('Events data received:', eventsData.events?.length || 0, 'items');
            } else {
              console.warn(`Wikipedia events API error: ${eventsResponse.status} - ${eventsResponse.statusText} - body: ${eventsErrBody}`);
            }
            
            // Check if at least one request was successful
            if (!birthsResponse.ok && !eventsResponse.ok) {
              throw new Error(`Both Wikipedia API requests failed: births(${birthsResponse.status}) body:"${birthsErrBody}" | events(${eventsResponse.status}) body:"${eventsErrBody}"`);
            }
            
          } catch (error) {
            console.error('Error fetching Wikipedia data:', error);
            throw new Error(`Failed to fetch historical data: ${error.message}`);
          }
          
          // Combine the data
          const combinedData = {
            births: birthsData.births || [],
            events: eventsData.events || []
          };
          
          return new Response(JSON.stringify(combinedData), {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600", // Cache for 1 hour
            },
          });
        } catch (error) {
          console.error('OnThisDay API error:', error);
          return new Response(JSON.stringify({ 
            error: "Failed to fetch historical data",
            details: error.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (path === "/robots.txt") {
        
        // Serve robots.txt with caching
        const cacheHeaders = getCacheHeaders(robots, "static");

        return new Response(robots, {
          status: 200,
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            "content-type": "text/plain",
          },
        });
      } else if (path === "/sitemap.xml") {
        // Serve sitemap.xml with caching
        const cacheHeaders = getCacheHeaders(SITEMAP_CONTENT, "static");

        return new Response(SITEMAP_CONTENT, {
          status: 200,
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            "content-type": "application/xml",
          },
        });
      } else if (path === "/manifest.json") {
        // Serve manifest.json with caching
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
                purpose: "any maskable",
              },
              {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
              },
            ],
            categories: ["education", "reference", "history"],
            screenshots: [
              {
                src: "/screenshot-wide.png",
                sizes: "1280x720",
                type: "image/png",
                form_factor: "wide",
              },
              {
                src: "/screenshot-narrow.png",
                sizes: "750x1334",
                type: "image/png",
                form_factor: "narrow",
              },
            ],
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
            "content-type": "application/json",
          },
        });
      } else if (request.method === "POST") {
        // Return 405 for POST requests - this site only handles GET requests
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else if (path.endsWith(".html") || path === "/") {
        // redirect to index.html for HTML requests
        let processedHTML = HTML.replace(/{{host}}/g, originalHost);

        // 检查是否需要生成动态meta标签
        const baseUrl = "https://today.upalg.com";
        const baseDomain = new URL(baseUrl).hostname;
        const currentDomain = originalHost;

        // 只有当域名不同时才生成动态meta标签
        if (baseDomain !== currentDomain) {
          const pageData = {
            title: "On This Day in History - Explore Historical Events",
            description:
              "Discover important historical events and notable births that occurred on this day in history. Multi-language support to explore fascinating stories.",
            url: `https://${originalHost}`,
            canonical: `https://${originalHost}/`,
          };

          const dynamicMetaTags = generateMetaTags(pageData);

          // 替换HTML中的静态meta标签为动态生成的标签
          processedHTML = processedHTML.replace(/<title>.*?<\/title>/s, dynamicMetaTags);
        }

        // 生成缓存头
        const cacheHeaders = getCacheHeaders(processedHTML, "html");

        return new Response(processedHTML, {
          status: 200,
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            "content-type": "text/html",
          },
        });
      } else {
        return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
