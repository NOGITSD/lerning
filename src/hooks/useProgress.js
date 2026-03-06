import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'codequest_progress';

const getInitialProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return {
    python: { completed: [], current: 1 },
    javascript: { completed: [], current: 1 },
    cpp: { completed: [], current: 1 },
  };
};

export function useProgress() {
  const [progress, setProgress] = useState(getInitialProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [progress]);

  const completeLevel = useCallback((language, level) => {
    setProgress(prev => {
      const langProgress = { ...prev[language] };
      if (!langProgress.completed.includes(level)) {
        langProgress.completed = [...langProgress.completed, level].sort((a, b) => a - b);
      }
      if (level >= langProgress.current) {
        langProgress.current = level + 1;
      }
      return { ...prev, [language]: langProgress };
    });
  }, []);

  const isLevelUnlocked = useCallback((language, level) => {
    if (level === 1) return true;
    return progress[language].completed.includes(level - 1);
  }, [progress]);

  const isLevelCompleted = useCallback((language, level) => {
    return progress[language].completed.includes(level);
  }, [progress]);

  const getCompletedCount = useCallback((language) => {
    return progress[language].completed.length;
  }, [progress]);

  const getCurrentLevel = useCallback((language) => {
    return progress[language].current;
  }, [progress]);

  const resetProgress = useCallback((language) => {
    if (language) {
      setProgress(prev => ({
        ...prev,
        [language]: { completed: [], current: 1 }
      }));
    } else {
      setProgress({
        python: { completed: [], current: 1 },
        javascript: { completed: [], current: 1 },
        cpp: { completed: [], current: 1 },
      });
    }
  }, []);

  return {
    progress,
    completeLevel,
    isLevelUnlocked,
    isLevelCompleted,
    getCompletedCount,
    getCurrentLevel,
    resetProgress,
  };
}
