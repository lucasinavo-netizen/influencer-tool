"use client";

import { SearchHistory, deleteSearchHistory, clearSearchHistory } from '../lib/storage';
import { useState } from 'react';

interface SearchHistoryProps {
  history: SearchHistory[];
  onLoadHistory: (historyItem: SearchHistory) => void;
  onRefresh: () => void;
}

export function SearchHistoryComponent({ history, onLoadHistory, onRefresh }: SearchHistoryProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleDelete = (id: string) => {
    deleteSearchHistory(id);
    onRefresh();
  };

  const handleClearAll = () => {
    clearSearchHistory();
    setShowClearConfirm(false);
    onRefresh();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getFiltersText = (item: SearchHistory) => {
    const filters = [];
    if (item.filters.minFollowers) filters.push(`Min followers: ${item.filters.minFollowers.toLocaleString()}`);
    if (item.filters.maxFollowers) filters.push(`Max followers: ${item.filters.maxFollowers.toLocaleString()}`);
    if (item.filters.minEngagement) filters.push(`Min engagement: ${item.filters.minEngagement}%`);
    if (item.filters.category) filters.push(`Category: ${item.filters.category}`);
    if (item.filters.country) filters.push(`Region: ${item.filters.country}`);
    return filters.length > 0 ? filters.join(', ') : 'No filters applied';
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Search History</h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          Your recent searches will appear here. Start by searching for influencers using the form above.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Searches</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              Clear All
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onLoadHistory(item)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-gray-900">
                    "{item.searchTerm}"
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {item.platform}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.resultCount} results
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-1">
                  {getFiltersText(item)}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{formatDate(item.timestamp)}</span>
                  <span>Click to reload results</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Delete search"
              >
                <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}