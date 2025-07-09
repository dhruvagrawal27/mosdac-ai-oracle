
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const { messages, context } = await req.json();

    console.log('Calling Groq API with context:', context ? 'provided' : 'none');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-90b-text-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre). 
            Provide clear, well-formatted responses about ISRO satellites, weather data, and ocean monitoring.
            
            Format your responses with proper line breaks and structure:
            - Use **bold** for important terms
            - Use numbered lists for steps or points
            - Keep paragraphs short and readable
            - Add line breaks between sections
            
            Context from MOSDAC knowledge base:
            ${context || 'General MOSDAC information available.'}`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', response.status, errorData);
      throw new Error(`Groq API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('Groq response received successfully');

    return new Response(JSON.stringify({ 
      answer: assistantMessage,
      sources: [],
      entities: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in groq-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      answer: "I apologize, but I encountered an error processing your question. Please try again.",
      sources: [],
      entities: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
