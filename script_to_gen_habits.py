import random
import json
import uuid
from faker import Faker

fake = Faker()

# 🎯 Your provided keyword/tag pool
keywords_pool = [
    'focus', 'energy', 'discipline', 'mindfulness', 'routine', 'strength',
    'calm', 'confidence', 'self-care', 'clarity', 'productivity', 'resilience',
    'motivation', 'creativity', 'flexibility', 'growth', 'mental health',
    'accountability', 'habits', 'routine building', 'emotional balance', 'positivity',
    'learning', 'wellbeing', 'goal setting', 'time management', 'consistency', 'reflection',
    'balance', 'empathy', 'communication', 'rejuvenation', 'fitness', 'nutrition',
    'hydration', 'sleep quality', 'digital wellbeing', 'vision', 'ambition', 'self-awareness',
    'work-life balance', 'stress relief', 'mental clarity', 'kindness', 'clean living',
    'dopamine detox', 'leadership', 'organization', 'clean eating', 'brain health',
    'journaling', 'optimism', 'awareness', 'growth mindset'
]

# ✅ Your curated habit pool
habit_pool = [
    'Meditation', 'Morning Yoga', 'Evening Stretch', 'Daily Run', 'Walk 10,000 Steps',
    'Gratitude Journaling', 'Bullet Journaling', 'Digital Detox', 'Sleep Before 11 PM',
    'Time Blocking', 'Reading Books', 'Listen to Podcasts', 'Drink 3L Water',
    'Meal Prepping', 'No Sugar Day', 'Cold Showers', 'Intermittent Fasting',
    'Strength Training', 'HIIT Workout', 'Pomodoro Focus', 'Stretching Routine',
    'Daily Reflection', 'Declutter Workspace', 'Breathing Exercises', 'Creative Writing',
    'Practice Music', 'Sketching/Doodling', 'Learn a Language', 'Skill Practice',
    'Yoga Nidra', 'Mindful Eating', 'Plan Next Day', 'Habit Tracking', 'Mood Tracking',
    'Early Wake Up', '30-Min Reading', 'Call a Friend', 'Help Someone', 'Volunteer Work',
    'Journal 5 Thoughts', 'Sleep Tracking', 'Daily Affirmations', 'Visualisation Practice',
    'No Social Media', 'Minimalist Day', 'Cooking Healthy Meal', 'Posture Correction',
    'Eye Relaxation', 'Gratitude Sharing', 'Learn Coding', 'Review Budget',
    'Clean Room', 'Digital Learning', 'Stretch Every Hour', 'Water Plants',
    'Monitor Caffeine', 'Meditate with App', 'Practice Silence', 'Sun Exposure',
    'Fitness Challenge', 'Walk Without Phone', 'Creative Break', 'News-Free Day',
    'Learn Public Speaking', 'Organize Emails', 'Inbox Zero', '5-Minute Cleanup',
    'Mindful Walking', 'Body Scan', 'Avoid Multitasking', 'Practice Gratitude',
    'Unplug Before Sleep', 'Evening Journaling'
]

# 🧠 Categories to map habits into
categories = ['physical', 'mental', 'wellness', 'productivity', 'hydration', 'nutrition', 'social', 'creativity', 'sleep']

def get_category(habit):
    habit_lower = habit.lower()
    if any(word in habit_lower for word in ['yoga', 'run', 'stretch', 'workout', 'training', 'walk', 'exercise']):
        return 'physical'
    elif any(word in habit_lower for word in ['journal', 'journaling', 'reflection', 'mindful', 'meditate']):
        return 'mental'
    elif any(word in habit_lower for word in ['meal', 'eat', 'nutrition', 'sugar', 'diet']):
        return 'nutrition'
    elif any(word in habit_lower for word in ['water', 'hydration', 'drink']):
        return 'hydration'
    elif any(word in habit_lower for word in ['read', 'coding', 'learn', 'language']):
        return 'productivity'
    elif any(word in habit_lower for word in ['friend', 'volunteer', 'gratitude', 'help']):
        return 'social'
    elif any(word in habit_lower for word in ['sleep', 'bed']):
        return 'sleep'
    elif any(word in habit_lower for word in ['draw', 'music', 'creative']):
        return 'creativity'
    else:
        return random.choice(categories)  # fallback

def generate_tags():
    return random.sample(keywords_pool, k=random.randint(4, 7))

def generate_tag_weights(tags):
    return {tag: round(random.uniform(0.6, 1.5), 2) for tag in tags}

def generate_habit(title):
    tags = generate_tags()
    return {
        "_id": str(uuid.uuid4()),
        "title": title,
        "tags": tags,
        "category": get_category(title),
        "tagWeights": generate_tag_weights(tags)
    }

# 🚀 Generate 10,000 entries (allowing duplicate titles)
habit_dataset = []

for _ in range(10000):
    title = random.choice(habit_pool)
    habit_dataset.append(generate_habit(title))

# 💾 Save to JSON
with open("habit_dataset_enhanced_10000.json", "w") as f:
    json.dump(habit_dataset, f, indent=4)

print("✅ Enhanced 10,000 habit entries saved to 'habit_dataset_enhanced_10000.json'")
