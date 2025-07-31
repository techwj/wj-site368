/**
 * @author: kared
 * @create_date: 2025-05-10 21:15:59
 * @last_editors: kared
 * @last_edit_time: 2025-05-11 01:25:36
 * @description: This Cloudflare Worker script handles image generation.
 */

// import html template
import HTML from './public/index.html';

// Available models list
const AVAILABLE_MODELS = [
  {
    id: 'stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL Base 1.0',
    description: 'Stability AI SDXL 文生图模型',
    key: '@cf/stabilityai/stable-diffusion-xl-base-1.0'
  },
  {
    id: 'flux-1-schnell',
    name: 'FLUX.1 [schnell]',
    description: '精确细节表现的高性能文生图模型',
    key: '@cf/black-forest-labs/flux-1-schnell'
  },
  {
    id: 'dreamshaper-8-lcm',
    name: 'DreamShaper 8 LCM',
    description: '增强图像真实感的 SD 微调模型',
    key: '@cf/lykon/dreamshaper-8-lcm'
  },
  {
    id: 'stable-diffusion-xl-lightning',
    name: 'Stable Diffusion XL Lightning',
    description: '更加高效的文生图模型',
    key: '@cf/bytedance/stable-diffusion-xl-lightning'
  }
];

// Random prompts list
const RANDOM_PROMPTS = [
  'cyberpunk cat samurai graphic art, blood splattered, beautiful colors',
  '1girl, solo, outdoors, camping, night, mountains, nature, stars, moon, tent, twin ponytails, green eyes, cheerful, happy, backpack, sleeping bag, camping stove, water bottle, mountain boots, gloves, sweater, hat, flashlight,forest, rocks, river, wood, smoke, shadows, contrast, clear sky, constellations, Milky Way',
  'masterpiece, best quality, amazing quality, very aesthetic, high resolution, ultra-detailed, absurdres, newest, scenery, anime, anime coloring, (dappled sunlight:1.2), rim light, backlit, dramatic shadow, 1girl, long blonde hair, blue eyes, shiny eyes, parted lips, medium breasts, puffy sleeve white dress, forest, flowers, white butterfly, looking at viewer',
  'frost_glass, masterpiece, best quality, absurdres, cute girl wearing red Christmas dress, holding small reindeer, hug, braided ponytail, sidelocks, hairclip, hair ornaments, green eyes, (snowy forest, moonlight, Christmas trees), (sparkles, sparkling clothes), frosted, snow, aurora, moon, night, sharp focus, highly detailed, abstract, flowing',
  '1girl, hatsune miku, white pupils, power elements, microphone, vibrant blue color palette, abstract,abstract background, dreamlike atmosphere, delicate linework, wind-swept hair, energy, masterpiece, best quality, amazing quality',
  'cyberpunk cat(neon lights:1.3) clutter,ultra detailed, ctrash, chaotic, low light, contrast, dark, rain ,at night ,cinematic , dystopic, broken ground, tunnels, skyscrapers',
  'Cyberpunk catgirl with purple hair, wearing leather and latex outfit with pink and purple cheetah print, holding a hand gun, black latex brassiere, glowing blue eyes with purple tech sunglasses, tail, large breasts, glowing techwear clothes, handguns, black leather jacket, tight shiny leather pants, cyberpunk alley background, Cyb3rWar3, Cyberware',
  'a wide aerial view of a floating elven city in the sky, with two elven figures walking side by side across a glowing skybridge, the bridge arching between tall crystal towers, surrounded by clouds and golden light, majestic and serene atmosphere, vivid style, magical fantasy architecture',
  'masterpiece, newest, absurdres,incredibly absurdres, best quality, amazing quality, very aesthetic, 1girl, very long hair, blonde, multi-tied hair, center-flap bangs, sunset, cumulonimbus cloud, old tree,sitting in tree, dark blue track suit, adidas, simple bird',
  'beautiful girl, breasts, curvy, looking down scope, looking away from viewer, laying on the ground, laying ontop of jacket, aiming a sniper rifle, dark braided hair, backwards hat, armor, sleeveless, arm sleeve tattoos, muscle tone, dogtags, sweaty, foreshortening, depth of field, at night, night, alpine, lightly snowing, dusting of snow, Closeup, detailed face, freckles',
];

// Passwords for authentication
// demo: const PASSWORDS = ['P@ssw0rd']
const PASSWORDS = []


export default {
  async fetch(request, env) {
    const originalHost = request.headers.get("host");

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // process api requests
      if (path === '/api/models') {
        // get available models list
        return new Response(JSON.stringify(AVAILABLE_MODELS), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else if (path === '/api/prompts') {
        // get random prompts list
        return new Response(JSON.stringify(RANDOM_PROMPTS), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else if (path === '/api/generate' && request.method === 'POST') {
        // process POST request for image generation
        const data = await request.json();
        
        // Check if password is required and valid
        if (PASSWORDS.length > 0 && (!data.password || !PASSWORDS.includes(data.password))) {
          return new Response(JSON.stringify({ error: 'Please enter the correct password' }), { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        if ('prompt' in data && 'model' in data) {
          const selectedModel = AVAILABLE_MODELS.find(m => m.id === data.model);
          if (!selectedModel) {
            return new Response(JSON.stringify({ error: 'Model is invalid' }), { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          const model = selectedModel.key;
          let inputs = {};
          
          // Input parameter processing
          if (data.model === 'flux-1-schnell') {
            let steps = data.num_steps || 6;
            if (steps >= 8) steps = 8;
            else if (steps <= 4) steps = 4;
            
            // Only prompt and steps
            inputs = {
              prompt: data.prompt || 'cyberpunk cat',
              steps: steps
            };
          } else {
            // Default input parameters
            inputs = {
              prompt: data.prompt || 'cyberpunk cat',
              negative_prompt: data.negative_prompt || '',
              height: data.height || 1024,
              width: data.width || 1024,
              num_steps: data.num_steps || 20,
              strength: data.strength || 0.1,
              guidance: data.guidance || 7.5,
              seed: data.seed || parseInt((Math.random() * 1024 * 1024).toString(), 10),
            };
          }

          console.log(`Generating image with ${model} and prompt: ${inputs.prompt.substring(0, 50)}...`);
          
          try {
            const response = await env.AI.run(model, inputs);
  
            // Processing the response of the flux-1-schnell model
            if (data.model === 'flux-1-schnell') {
              let jsonResponse;
  
              if (typeof response === 'object') {
                jsonResponse = response;
              } else {
                try {
                  jsonResponse = JSON.parse(response);
                } catch (e) {
                  console.error('Failed to parse JSON response:', e);
                  return new Response(JSON.stringify({ 
                    error: 'Failed to parse response',
                    details: e.message
                  }), { 
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  });
                }
              }
  
              if (!jsonResponse.image) {
                return new Response(JSON.stringify({ 
                  error: 'Invalid response format',
                  details: 'Image data not found in response'
                }), { 
                  status: 500,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
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
                    'content-type': 'image/png',
                  },
                });
              } catch (e) {
                console.error('Failed to convert base64 to binary:', e);
                return new Response(JSON.stringify({ 
                  error: 'Failed to process image data',
                  details: e.message
                }), { 
                  status: 500,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            } else {
                // Return the response directly
                return new Response(response, {
                  headers: {
                    ...corsHeaders, 
                    'content-type': 'image/png',
                  },
                });
              }
            } catch (aiError) {
            console.error('AI generation error:', aiError);
            return new Response(JSON.stringify({ 
              error: 'Image generation failed',
              details: aiError.message
            }), { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } else {
          return new Response(JSON.stringify({ error: 'Missing required parameter: prompt or model' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      } else if (request.method === 'POST') {
        // Return 405 for other POST requests
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } else if (path.endsWith('.html') || path === '/') {
        // redirect to index.html for HTML requests
        return new Response(HTML.replace(/{{host}}/g, originalHost), {
          status: 200,
          headers: {
            ...corsHeaders,
            "content-type": "text/html"
          }
        });
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};