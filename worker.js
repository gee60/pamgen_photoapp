export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers for your website
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle Uploads
    if (url.pathname === "/upload" && request.method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file");
      
      if (!file) {
        return new Response(JSON.stringify({ error: "No file uploaded" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Store in R2 Bucket binding (name your R2 bucket binding 'MY_BUCKET' in worker settings)
      await env.MY_BUCKET.put(file.name, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      return new Response(JSON.stringify({ success: true, url: `https://pub-bea8c4084925441c9b1f3b934025ec8b.r2.dev/${file.name}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Handle Listing items in bucket
    if (url.pathname === "/list" && request.method === "GET") {
      const listed = await env.MY_BUCKET.list();
      const objects = listed.objects.map(obj => {
        const isVideo = obj.key.match(/\.(mp4|mov|webm|avi|mkv)$/i);
        return {
          name: obj.key,
          url: `https://pub-bea8c4084925441c9b1f3b934025ec8b.r2.dev/${obj.key}`,
          type: isVideo ? 'video' : 'image'
        };
      });

      return new Response(JSON.stringify(objects), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};
