"use client";

import { Author, getCollections, addToCollection, saveCollection } from '../lib/storage';
import { useState, useRef, useEffect } from 'react';

interface AuthorCardProps {
  author: Author;
  isSelected: boolean;
  onToggleSelect: (username: string) => void;
  showFavoriteButton?: boolean;
  className?: string;
}

export function AuthorCard({ 
  author, 
  isSelected, 
  onToggleSelect, 
  showFavoriteButton = true,
  className = ""
}: AuthorCardProps) {
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [collections, setCollections] = useState(getCollections());
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCollectionMenu(false);
        setShowNewCollectionForm(false);
        setNewCollectionName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null || num === 0) return "-";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  };

  const tierLabel = (followers: number) => {
    if (followers >= 1_000_000) return { text: "Mega", color: "bg-purple-100 text-purple-700 border-purple-200" };
    if (followers >= 100_000) return { text: "Macro", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (followers >= 10_000) return { text: "Mid-Tier", color: "bg-green-100 text-green-700 border-green-200" };
    if (followers >= 1_000) return { text: "Micro", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    return { text: "Nano", color: "bg-gray-100 text-gray-700 border-gray-200" };
  };

  const engagementColor = (rate: number) => {
    if (rate >= 5) return "text-green-600";
    if (rate >= 2) return "text-blue-600";
    if (rate >= 1) return "text-yellow-600";
    return "text-red-600";
  };

  const handleAddToCollection = (collectionId: string) => {
    addToCollection(collectionId, author);
    setCollections(getCollections()); // Refresh collections
    setShowCollectionMenu(false);
  };

  const handleCreateNewCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      const newId = saveCollection({
        name: newCollectionName.trim(),
        authors: [author]
      });
      if (newId) {
        setCollections(getCollections()); // Refresh collections
        setShowNewCollectionForm(false);
        setShowCollectionMenu(false);
        setNewCollectionName('');
      }
    }
  };

  const tier = tierLabel(author.followers);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onToggleSelect(author.username)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        {author.avatar ? (
          <img 
            src={author.avatar} 
            alt={author.username}
            className="w-12 h-12 rounded-full object-cover border border-gray-200" 
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <span className="text-gray-600 font-medium">
              {author.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={author.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              @{author.username}
            </a>
            {author.verified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Verified
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tier.color}`}>
              {tier.text}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{author.nickname}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Followers</span>
              <p className="font-medium text-gray-900">{formatNumber(author.followers)}</p>
            </div>
            <div>
              <span className="text-gray-500">Engagement</span>
              <p className={`font-medium ${engagementColor(author.engagementRate)}`}>
                {author.engagementRate}%
              </p>
            </div>
            <div>
              <span className="text-gray-500">Avg Likes</span>
              <p className="font-medium text-gray-900">{formatNumber(author.avgLikes)}</p>
            </div>
            <div>
              <span className="text-gray-500">Platform</span>
              <p className="font-medium text-gray-900 capitalize">{author.platform}</p>
            </div>
          </div>

          {(author.email || author.externalUrl || author.bio) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {author.email && (
                <div className="text-xs mb-1">
                  <span className="text-gray-500">Email: </span>
                  <a 
                    href={`mailto:${author.email}`} 
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {author.email}
                  </a>
                </div>
              )}
              {author.externalUrl && (
                <div className="text-xs mb-1">
                  <span className="text-gray-500">Website: </span>
                  <a 
                    href={author.externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {author.externalUrl.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {author.bio && (
                <p className="text-xs text-gray-600 line-clamp-2">{author.bio}</p>
              )}
            </div>
          )}
        </div>

        {showFavoriteButton && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCollectionMenu(!showCollectionMenu);
              }}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              title="Add to collection"
            >
              <svg className="w-5 h-5 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>

            {showCollectionMenu && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Add to Collection</p>
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  {collections.length > 0 ? (
                    collections.map(collection => (
                      <button
                        key={collection.id}
                        onClick={() => handleAddToCollection(collection.id)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span>{collection.name}</span>
                        <span className="text-xs text-gray-500">{collection.authors.length}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No collections yet</div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-100">
                  {!showNewCollectionForm ? (
                    <button
                      onClick={() => setShowNewCollectionForm(true)}
                      className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                    >
                      Create New Collection
                    </button>
                  ) : (
                    <form onSubmit={handleCreateNewCollection} className="space-y-2">
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Collection name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCollectionForm(false);
                            setNewCollectionName('');
                          }}
                          className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}