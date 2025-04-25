import { PlusCircle, Star, Clock, Tag } from 'lucide-react';

export default function HabitCard({ 
  title, 
  description, 
  tags = [], 
  score = 0, 
  difficulty = 'medium',
  frequency = 'daily',
  onAddToLibrary
}) {
  const getMatchColors = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (numScore >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (numScore >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const difficultyMap = {
    easy: { color: 'text-green-600', stars: 1 },
    medium: { color: 'text-yellow-600', stars: 2 },
    hard: { color: 'text-red-600', stars: 3 }
  };

  const difficultyInfo = difficultyMap[difficulty] || difficultyMap.medium;

  return (
    <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
      {/* Keep existing card structure */}
      
      <button
        onClick={onAddToLibrary}
        className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100"
      >
        <PlusCircle size={16} />
        Add to my habits
      </button>
    </div>
  );
}