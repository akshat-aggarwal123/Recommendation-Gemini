// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { habitTitle } = req.body;
    
    if (!habitTitle || habitTitle.trim() === '') {
      return res.status(400).json({ error: 'Habit title is required' });
    }

    // Your Gemini API key should be in environment variables
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Based on the habit "${habitTitle}", suggest 5 similar or related habits that someone might want to track. 
                  Format your response as a JSON array of objects, where each object has a "title" field for the habit name, 
                  "tags" field with an array of relevant tags/categories, and a "similarity" field with a number between 0 and 1 
                  indicating how similar it is to the original habit. Example format:
                  [
                    {
                      "title": "Morning Meditation",
                      "tags": ["wellness", "mental health"],
                      "similarity": 0.85
                    }
                  ]`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Error generating recommendations");
    }

    // Extract the text content from the Gemini API response
    const textContent = data.candidates[0].content.parts[0].text;
    
    // Find JSON in the response and parse it
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Could not parse recommendation data");
    
    const recommendationsData = JSON.parse(jsonMatch[0]);
    res.status(200).json(recommendationsData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Failed to get recommendations' });
  }
}
