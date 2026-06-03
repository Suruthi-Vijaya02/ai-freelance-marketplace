// client/src/components/Profile/AiSuggestions.jsx
import { useState, useEffect } from 'react';
import { userService } from '../../services/authService';
import { Sparkles, Check, X, Loader2, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

const AiSuggestions = ({ userId, onProfileUpdate }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [bioSuggestion, setBioSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [aiInfo, setAiInfo] = useState(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await userService.getAiSuggestions();
      const data = res.data?.data;

      // ✅ FIX: Check if there are actual unapplied suggestions
      const unappliedSuggestions = (data?.suggestions || []).filter(s => !s.applied);
      const unappliedBio = data?.bioSuggestion && !data.bioSuggestion.applied ? data.bioSuggestion : null;

      if (unappliedSuggestions.length === 0 && !unappliedBio) {
        setHidden(true);
        return;
      }

      setSuggestions(unappliedSuggestions);
      setBioSuggestion(unappliedBio);
      setAiInfo(data?.aiInfo);
      setHidden(false);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setHidden(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUseBio = async () => {
    if (!bioSuggestion?.text) return;

    try {
      await userService.saveBio({ bio: bioSuggestion.text });
      setBioSuggestion(null); // ✅ Immediately remove from UI

      // Notify parent to refresh profile
      if (onProfileUpdate) onProfileUpdate({ bio: bioSuggestion.text });

      toast.success('Bio saved!');

      // Check if we should hide entire component
      if (suggestions.length === 0) {
        setHidden(true);
      }
    } catch (err) {
      toast.error('Failed to save bio');
    }
  };

  const handleApplyAll = async () => {
    try {
      await userService.applyAiSuggestions({
        suggestions: suggestions.map(s => ({
          type: s.type,
          field: s.type === 'bio' ? 'bio' : s.type === 'skills' ? 'skills' : null,
          value: s.type === 'skills' ? [] : null
        })),
        bio: bioSuggestion?.text
      });

      // ✅ FIX: Clear all and hide
      setSuggestions([]);
      setBioSuggestion(null);
      setHidden(true);

      if (onProfileUpdate) onProfileUpdate({});
      toast.success('All suggestions applied!');
    } catch (err) {
      toast.error('Failed to apply suggestions');
    }
  };

  const handleDismiss = async () => {
    try {
      await userService.applyAiSuggestions({ dismissAll: true });
      setHidden(true);
      toast.success('Suggestions dismissed for 24 hours');
    } catch (err) {
      console.error('Dismiss failed:', err);
    }
  };

  const handleApplySuggestion = async (suggestion) => {
    try {
      await userService.applyAiSuggestions({
        suggestions: [{ type: suggestion.type, field: suggestion.action, value: true }]
      });

      // Remove this specific suggestion from UI
      setSuggestions(prev => prev.filter(s => s.type !== suggestion.type));

      if (suggestions.length === 1 && !bioSuggestion) {
        setHidden(true);
      }

      toast.success(`${suggestion.type} suggestion applied!`);
    } catch (err) {
      toast.error('Failed to apply');
    }
  };

  if (hidden || loading) {
    if (loading) {
      return (
        <div className="ai-suggestions-card p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span className="text-sm text-purple-700">Loading AI suggestions...</span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="ai-suggestions-card bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-purple-900">AI Profile Suggestions</h3>
            <p className="text-xs text-purple-600">
              {aiInfo?.source === 'local-ai-qwen3' 
                ? 'Powered by local AI (Qwen3-0.6B)' 
                : 'Powered by smart templates'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="p-1 hover:bg-purple-100 rounded-full transition-colors"
          title="Dismiss for 24 hours"
        >
          <X className="w-4 h-4 text-purple-500" />
        </button>
      </div>

      {/* Bio Suggestion */}
      {bioSuggestion?.text && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-800">AI-Generated Bio</span>
          </div>
          <p className="text-sm text-gray-600 italic leading-relaxed mb-3">
            "{bioSuggestion.text}"
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUseBio}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Use this Bio
            </button>
            <button
              onClick={handleApplyAll}
              className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 text-sm rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Apply All
            </button>
          </div>
        </div>
      )}

      {/* Individual Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                suggestion.priority === 'high' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-white border-purple-100'
              }`}
            >
              <div className={`mt-0.5 w-2 h-2 rounded-full ${
                suggestion.priority === 'high' ? 'bg-red-400' : 'bg-purple-400'
              }`} />
              <div className="flex-1">
                <p className="text-sm text-gray-700">{suggestion.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    suggestion.priority === 'high' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {suggestion.priority}
                  </span>
                  <button
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                  >
                    Apply suggestion
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      <p className="text-xs text-purple-400 mt-4 text-center">
        AI runs locally on your server — no data leaves your system
      </p>
    </div>
  );
};

export default AiSuggestions;