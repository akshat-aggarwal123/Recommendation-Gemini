import { useState, useEffect } from 'react';
import HabitCard from '../components/HabitCard';
import { ArrowRight, Loader2, AlertCircle, ThumbsUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import useDebounce from '../hooks/useDebounce';

export default function Recommend() {
  const [inputHabit, setInputHabit] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const { data: session } = useSession();
  
  // Popular habit tags
  const popularTags = ['fitness', 'health', 'productivity', 'mindfulness', 'learning', 'finance', 'social'];
  
  // API key from environment variable (more secure)
  const API_KEY = process.env.GEMINI_API_KEY;
  
  // Debounce the input to avoid making too many API calls
  const debouncedInput = useDebounce(inputHabit, 500);
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const generateRecommendations = async (habitTitle, tags = []) => {
    if (!API_KEY) {
      setError("API key not configured. Please set GEMINI_API_KEY in your environment variables.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
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
                    text: `Based on the habit "${habitTitle}"${tags.length > 0 ? ` with tags: ${tags.join(', ')}` : ''}, 
                    suggest 5 similar or related habits that someone might want to track. 
                    Make sure the recommendations are varied, practical, and specific.
                    Format your response as a JSON array of objects, where each object has:
                    - "title" field for the habit name (concise but specific)
                    - "description" field with a brief explanation of the habit and its benefits (1-2 sentences)
                    - "tags" field with an array of relevant tags/categories (2-4 tags)
                    - "similarity" field with a number between 0 and 1 indicating similarity to original habit
                    - "difficulty" field with "easy", "medium", or "hard"
                    - "frequency" field with recommended tracking frequency like "daily", "weekly", etc.
                    
                    Example format:
                    [
                      {
                        "title": "10-Minute Morning Meditation",
                        "description": "Start each day with a focused meditation session to improve mindfulness and reduce stress.",
                        "tags": ["wellness", "mental health", "morning routine"],
                        "similarity": 0.85,
                        "difficulty": "easy",
                        "frequency": "daily"
                      }
                    ]`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
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
      
      // Add unique IDs to each recommendation
      const recommendationsWithIds = recommendationsData.map((rec, idx) => ({
        ...rec,
        id: `rec-${Date.now()}-${idx}`
      }));
      
      setRecommendations(recommendationsWithIds);
      setSuccess(true);
      
      // Save to history if user is logged in
      if (session?.user) {
        saveSearchToHistory(habitTitle, tags, recommendationsWithIds);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to get recommendations");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const saveSearchToHistory = async (query, tags, results) => {
    try {
      await fetch('/api/habit/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user.id,
          query,
          tags,
          results: results.map(r => r.title),
          timestamp: new Date()
        })
      });
    } catch (err) {
      console.error("Failed to save search history:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputHabit.trim()) return;
    await generateRecommendations(inputHabit, selectedTags);
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addHabitToLibrary = async (habit) => {
    if (!session?.user) {
      setError("Please log in to save habits to your library");
      return;
    }
    
    try {
      const response = await fetch('/api/habit/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user.id,
          title: habit.title,
          description: habit.description,
          tags: habit.tags,
          difficulty: habit.difficulty,
          frequency: habit.frequency
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to save habit");
      }
      
      setSuccess(`"${habit.title}" added to your habit library!`);
    } catch (err) {
      setError(err.message || "Failed to save habit");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Habit Recommender</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label htmlFor="habit-input" className="block text-sm font-medium text-gray-700 mb-1">
            What habit are you interested in?
          </label>
          <input
            id="habit-input"
            type="text"
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="E.g. Morning meditation, daily reading, jogging..."
            value={inputHabit}
            onChange={(e) => setInputHabit(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select relevant tags (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`px-3 py-1 rounded-full text-sm transition ${
                  selectedTags.includes(tag) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
          disabled={loading || !inputHabit.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Get Recommendations
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && !error && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
          <ThumbsUp size={20} className="mt-0.5 flex-shrink-0" />
          <span>{typeof success === 'string' ? success : 'Recommendations generated successfully!'}</span>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Recommendations for "{inputHabit}"</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((habit) => (
              <HabitCard 
                key={habit.id} 
                title={habit.title} 
                description={habit.description}
                tags={habit.tags} 
                score={parseFloat(habit.similarity).toFixed(2)}
                difficulty={habit.difficulty}
                frequency={habit.frequency}
                onAddToLibrary={() => addHabitToLibrary(habit)}
                isLoggedIn={!!session?.user}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && recommendations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No recommendations yet</h3>
          <p className="text-gray-500">Enter a habit you're interested in and we'll suggest related ones to try!</p>
        </div>
      )}
      
      {session?.user ? (
        <p className="text-sm text-gray-500 mt-8">
          Your recommendations will be saved to your search history.
        </p>
      ) : (
        <p className="text-sm text-gray-500 mt-8">
          <a href="/api/auth/signin" className="text-blue-600 hover:underline">Sign in</a> to save habits to your library and view your search history.
        </p>
      )}
    </div>
  );
}