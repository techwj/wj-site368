/**
 * @author: kared
 * @create_date: 2025-05-10 21:15:59
 * @last_editors: kared
 * @last_edit_time: 2025-05-11 01:25:36
 * @description: This Cloudflare Worker script handles QR code generation with AI backgrounds.
 */

// import html template
import HTML from "./public/index.html";
import robots from "./public/robots.txt";
import QRCode from 'qrcode';

// Sitemap content
const SITEMAP_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://qrcode.upalg.com/</loc>
    <lastmod>2025-01-27</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://qrcode.upalg.com/manifest.json</loc>
    <lastmod>2025-01-27</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;


// 动态生成meta标签功能
function generateMetaTags(pageData = {}) {
  const baseUrl = "https://qrcode.upalg.com";
  const defaultTitle = "Free AI QR Code Generator - Create Beautiful QR Codes";
  const defaultDescription =
    "Create beautiful QR codes with AI-generated backgrounds. Free online tool for websites, marketing, and social media campaigns.";

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

// Available models list
const AVAILABLE_MODELS = [
  {
    id: "stable-diffusion-xl-base-1.0",
    name: "Stable Diffusion XL Base 1.0",
    description: "SDXL Base model",
    key: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  },
  {
    id: "flux-1-schnell",
    name: "FLUX.1 [schnell]",
    description: "High-performance model",
    key: "@cf/black-forest-labs/flux-1-schnell",
  },
  {
    id: "dreamshaper-8-lcm",
    name: "DreamShaper 8 LCM",
    description: "Photorealistic model",
    key: "@cf/lykon/dreamshaper-8-lcm",
  },
  {
    id: "stable-diffusion-xl-lightning",
    name: "Stable Diffusion XL Lightning",
    description: "Fast generation",
    key: "@cf/bytedance/stable-diffusion-xl-lightning",
  },
];

// Random prompts list
const RANDOM_PROMPTS = [
  "cyberpunk cat samurai graphic art, blood splattered, beautiful colors",
  "1girl, solo, outdoors, camping, night, mountains, nature, stars, moon, tent, twin ponytails, green eyes, cheerful, happy, backpack, sleeping bag, camping stove, water bottle, mountain boots, gloves, sweater, hat, flashlight,forest, rocks, river, wood, smoke, shadows, contrast, clear sky, constellations, Milky Way",
  "masterpiece, best quality, amazing quality, very aesthetic, high resolution, ultra-detailed, absurdres, newest, scenery, anime, anime coloring, (dappled sunlight:1.2), rim light, backlit, dramatic shadow, 1girl, long blonde hair, blue eyes, shiny eyes, parted lips, medium breasts, puffy sleeve white dress, forest, flowers, white butterfly, looking at viewer",
  "frost_glass, masterpiece, best quality, absurdres, cute girl wearing red Christmas dress, holding small reindeer, hug, braided ponytail, sidelocks, hairclip, hair ornaments, green eyes, (snowy forest, moonlight, Christmas trees), (sparkles, sparkling clothes), frosted, snow, aurora, moon, night, sharp focus, highly detailed, abstract, flowing",
  "1girl, hatsune miku, white pupils, power elements, microphone, vibrant blue color palette, abstract,abstract background, dreamlike atmosphere, delicate linework, wind-swept hair, energy, masterpiece, best quality, amazing quality",
  "cyberpunk cat(neon lights:1.3) clutter,ultra detailed, ctrash, chaotic, low light, contrast, dark, rain ,at night ,cinematic , dystopic, broken ground, tunnels, skyscrapers",
  "Cyberpunk catgirl with purple hair, wearing leather and latex outfit with pink and purple cheetah print, holding a hand gun, black latex brassiere, glowing blue eyes with purple tech sunglasses, tail, large breasts, glowing techwear clothes, handguns, black leather jacket, tight shiny leather pants, cyberpunk alley background, Cyb3rWar3, Cyberware",
  "a wide aerial view of a floating elven city in the sky, with two elven figures walking side by side across a glowing skybridge, the bridge arching between tall crystal towers, surrounded by clouds and golden light, majestic and serene atmosphere, vivid style, magical fantasy architecture",
  "masterpiece, newest, absurdres,incredibly absurdres, best quality, amazing quality, very aesthetic, 1girl, very long hair, blonde, multi-tied hair, center-flap bangs, sunset, cumulonimbus cloud, old tree,sitting in tree, dark blue track suit, adidas, simple bird",
  "beautiful girl, breasts, curvy, looking down scope, looking away from viewer, laying on the ground, laying ontop of jacket, aiming a sniper rifle, dark braided hair, backwards hat, armor, sleeveless, arm sleeve tattoos, muscle tone, dogtags, sweaty, foreshortening, depth of field, at night, night, alpine, lightly snowing, dusting of snow, Closeup, detailed face, freckles",
];



// Passwords for authentication
// demo: const PASSWORDS = ['P@ssw0rd']
const PASSWORDS = [];

// Utility to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

      // process api requests
      if (path === "/api/models") {
        // get available models list
        return new Response(JSON.stringify(AVAILABLE_MODELS), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      } else if (path === "/api/prompts") {
        // get random prompts list
        return new Response(JSON.stringify(RANDOM_PROMPTS), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      } else if (path === "/api/generate-qr" && request.method === "POST") {
        
        try {
          // process POST request for QR code generation
          const data = await request.json();

          // Check if password is required and valid
          if (PASSWORDS.length > 0 && (!data.password || !PASSWORDS.includes(data.password))) {
            return new Response(JSON.stringify({ error: "Please enter the correct password" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          if ("url" in data && "style" in data) {
            // Validate URL format
            try {
              new URL(data.url);
            } catch (e) {
              return new Response(JSON.stringify({ error: "Invalid URL format" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            const selectedModel = AVAILABLE_MODELS.find((m) => m.id === data.style);
            if (!selectedModel) {
              return new Response(JSON.stringify({ error: "Style is invalid" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }


            try {
              // Step 1: Generate AI background first
              const backgroundPrompt = `Beautiful artistic background in ${selectedModel.description} style, abstract design, vibrant colors, high quality, professional design, suitable for QR code overlay, clean composition`;
              
              const model = selectedModel.key;
              let inputs = {};

              // Input parameter processing for background generation
              if (data.style === "flux-1-schnell") {
                inputs = {
                  prompt: backgroundPrompt,
                  steps: 6,
                };
              } else {
                inputs = {
                  prompt: backgroundPrompt,
                  negative_prompt: "text, words, letters, busy pattern, cluttered, noisy background",
                  height: 1024,
                  width: 1024,
                  num_steps: 20,
                  strength: 0.1,
                  guidance: 7.5,
                  seed: parseInt((Math.random() * 1024 * 1024).toString(), 10),
                };
              }

              const aiResponse = await env.AI.run(model, inputs);
              
              // Step 2: Process AI response to get background image
              let backgroundImageBase64;

              if (aiResponse.image && typeof aiResponse.image === 'string') {
                // Handle JSON response with base64 image (like flux)
                backgroundImageBase64 = aiResponse.image;
              } else if (aiResponse instanceof ArrayBuffer) {
                // Handle raw ArrayBuffer response
                backgroundImageBase64 = arrayBufferToBase64(aiResponse);
              } else if (aiResponse instanceof ReadableStream) {
                // Handle ReadableStream response
                const chunks = [];
                const reader = aiResponse.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  chunks.push(value);
                }
                const buffer = new Uint8Array(chunks.reduce((acc, val) => acc + val.length, 0));
                let offset = 0;
                for (const chunk of chunks) {
                  buffer.set(chunk, offset);
                  offset += chunk.length;
                }
                backgroundImageBase64 = arrayBufferToBase64(buffer.buffer);
              } else {
                // Fallback for other unexpected response types
                try {
                  const jsonResponse = JSON.parse(aiResponse);
                  if (jsonResponse.image) {
                    backgroundImageBase64 = jsonResponse.image;
                  } else {
                    throw new Error("Unsupported AI response format");
                  }
                } catch (e) {
                  console.error("Unsupported AI response format:", aiResponse);
                  throw new Error("Unsupported AI response format");
                }
              }

              // Step 3: Generate real QR code as an SVG string
              const svgString = await QRCode.toString(data.url, {
                type: 'svg',
                width: 300,
                margin: 1,
                errorCorrectionLevel: 'H'
              });
              const qrDataURL = `data:image/svg+xml;base64,${btoa(svgString)}`;

              // Step 4: Return both images as base64 strings
              return new Response(JSON.stringify({
                backgroundImage: `data:image/png;base64,${backgroundImageBase64}`,
                qrCodeImage: qrDataURL
              }), {
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              });

            } catch (aiError) {
              console.error("QR code generation error:", aiError);
              return new Response(
                JSON.stringify({
                  error: "QR code generation failed",
                  details: aiError.message,
                }),
                {
                  status: 500,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
              );
            }
          } else {
            return new Response(JSON.stringify({ error: "Missing required parameter: url or style" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return new Response(JSON.stringify({ error: "Invalid JSON data" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (path === "/api/generate" && request.method === "POST") {
        // process POST request for image generation
        const data = await request.json();

        // Check if password is required and valid
        if (PASSWORDS.length > 0 && (!data.password || !PASSWORDS.includes(data.password))) {
          return new Response(JSON.stringify({ error: "Please enter the correct password" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if ("prompt" in data && "model" in data) {
          const selectedModel = AVAILABLE_MODELS.find((m) => m.id === data.model);
          if (!selectedModel) {
            return new Response(JSON.stringify({ error: "Model is invalid" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const model = selectedModel.key;
          let inputs = {};

          // Input parameter processing
          if (data.model === "flux-1-schnell") {
            let steps = data.num_steps || 6;
            if (steps >= 8) steps = 8;
            else if (steps <= 4) steps = 4;

            // Only prompt and steps
            inputs = {
              prompt: data.prompt || "cyberpunk cat",
              steps: steps,
            };
          } else {
            // Default input parameters
            inputs = {
              prompt: data.prompt || "cyberpunk cat",
              negative_prompt: data.negative_prompt || "",
              height: data.height || 1024,
              width: data.width || 1024,
              num_steps: data.num_steps || 20,
              strength: data.strength || 0.1,
              guidance: data.guidance || 7.5,
              seed: data.seed || parseInt((Math.random() * 1024 * 1024).toString(), 10),
            };
          }


          try {
            const response = await env.AI.run(model, inputs);

            // Processing the response of the flux-1-schnell model
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
                      details: e.message,
                    }),
                    {
                      status: 500,
                      headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                  );
                }
              }

              if (!jsonResponse.image) {
                return new Response(
                  JSON.stringify({
                    error: "Invalid response format",
                    details: "Image data not found in response",
                  }),
                  {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                  }
                );
              }

              try {
                // Convert from base64 to binary data
                const binaryString = atob(jsonResponse.image);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }

                // Returns binary data in PNG format
                return new Response(bytes, {
                  headers: {
                    ...corsHeaders,
                    "content-type": "image/png",
                  },
                });
              } catch (e) {
                console.error("Failed to convert base64 to binary:", e);
                return new Response(
                  JSON.stringify({
                    error: "Failed to process image data",
                    details: e.message,
                  }),
                  {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                  }
                );
              }
            } else {
              // Return the response directly
              return new Response(response, {
                headers: {
                  ...corsHeaders,
                  "content-type": "image/png",
                },
              });
            }
          } catch (aiError) {
            console.error("AI generation error:", aiError);
            return new Response(
              JSON.stringify({
                error: "Image generation failed",
                details: aiError.message,
              }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        } else {
          return new Response(JSON.stringify({ error: "Missing required parameter: prompt or model" }), {
            status: 400,
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
            name: "AI QR Code Generator",
            short_name: "AI QR Gen",
            description: "Free AI QR code generator with beautiful backgrounds powered by Cloudflare Workers",
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
            categories: ["productivity", "utilities", "business"],
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
        
        // Return 405 for other POST requests
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else if (path.endsWith(".html") || path === "/") {
        // redirect to index.html for HTML requests
        let processedHTML = HTML.replace(/{{host}}/g, originalHost);

        // 检查是否需要生成动态meta标签
        const baseUrl = "https://qrcode.upalg.com";
        const baseDomain = new URL(baseUrl).hostname;
        const currentDomain = originalHost;

        // 只有当域名不同时才生成动态meta标签
        if (baseDomain !== currentDomain) {
          const pageData = {
            title: "Free AI QR Code Generator - Create Beautiful QR Codes",
            description:
              "Create beautiful QR codes with AI-generated backgrounds. Free online tool for websites, marketing, and social media campaigns.",
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
