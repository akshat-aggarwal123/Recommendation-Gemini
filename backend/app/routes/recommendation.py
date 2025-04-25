from fastapi import APIRouter, HTTPException
from app.db.mongo import habit_collection
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
import requests
import os
import json
import re

router = APIRouter()

@router.get("/recommend/{habit_title}")
def recommend_habits(habit_title: str):
    # Fetch habits
    habits = list(habit_collection.find({}, {"_id": 0, "title": 1, "tags": 1}))
    df = pd.DataFrame(habits)
    if df.empty:
        return {"error": "No habits found in database"}
    # Join tags
    df["tags_joined"] = df["tags"].apply(lambda x: " ".join(x))
    # TF-IDF + Cosine Similarity
    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform(df["tags_joined"])
    idx = df[df["title"] == habit_title].index
    if idx.empty:
        return {"error": "Habit not found"}
    cosine_sim = cosine_similarity(tfidf_matrix[idx[0]], tfidf_matrix).flatten() # type: ignore
    df["similarity"] = cosine_sim
    # Sort by similarity and exclude the queried habit
    df_sorted = df[df["title"] != habit_title].sort_values(by="similarity", ascending=False)
    # Top 5 recommendations
    top_recommendations = df_sorted.head(5)[["title", "tags", "similarity"]].to_dict(orient="records")
    return top_recommendations

@router.get("/gemini-recommend/{habit_title}")
def gemini_recommend_habits(habit_title: str):
    """
    Generate habit recommendations using Google's Gemini API based on a habit title.
    """
    # Get API key from environment variable
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        # Prepare the request to Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"""Based on the habit "{habit_title}", suggest 5 similar or related habits that someone might want to track. 
                            Format your response as a JSON array of objects, where each object has a "title" field for the habit name, 
                            "tags" field with an array of relevant tags/categories, and a "similarity" field with a number between 0 and 1 
                            indicating how similar it is to the original habit. Example format:
                            [
                              {{
                                "title": "Morning Meditation",
                                "tags": ["wellness", "mental health"],
                                "similarity": 0.85
                              }}
                            ]"""
                        }
                    ]
                }
            ]
        }
        
        headers = {"Content-Type": "application/json"}
        
        # Send request to Gemini API
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract text content from response
        text_content = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Find JSON array in the response
        json_match = re.search(r'\[[\s\S]*\]', text_content)
        if not json_match:
            raise HTTPException(status_code=500, detail="Failed to parse recommendation data from Gemini API")
        
        # Parse recommendations data
        recommendations = json.loads(json_match.group(0))
        
        return recommendations
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error calling Gemini API: {str(e)}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse JSON from Gemini API response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")