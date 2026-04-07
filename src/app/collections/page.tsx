"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCollections, deleteCollection, updateCollection, removeFromCollection, exportCollectionAsCSV, Collection } from '../lib/storage';
import { AuthorCard } from '../components/AuthorCard';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    setCollections(getCollections());
  }, []);

  const handleDeleteCollection = (id: string) => {
    if (confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      deleteCollection(id);
      setCollections(getCollections());
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    }
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection.id);
    setEditName(collection.name);
    setEditDescription(collection.description || '');
  };

  const handleSaveEdit = () => {
    if (editingCollection) {
      updateCollection(editingCollection, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      setCollections(getCollections());
      if (selectedCollection?.id === editingCollection) {
        const updated = getCollections().find(c => c.id === editingCollection);
        if (updated) setSelectedCollection(updated);
      }
      setEditingCollection(null);
    }
  };

  const handleRemoveFromCollection = (authorUsername: string, platform: string) => {
    if (selectedCollection) {
      removeFromCollection(selectedCollection.id, authorUsername, platform);
      const updated = getCollections().find(c => c.id === selectedCollection.id);
      if (updated) {
        setSelectedCollection(updated);
        setCollections(getCollections());
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Search
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Collections</h1>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Collections Yet</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Save your favorite creators to collections for easy access later. Start by searching for influencers and clicking the star icon.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Searching
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Search
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Collections</h1>
            <span className="text-sm text-gray-500">({collections.length})</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Collections Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">Your Collections</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {collections.map(collection => (
                  <div
                    key={collection.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCollection?.id === collection.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                    onClick={() => setSelectedCollection(collection)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingCollection === collection.id ? (
                          <div className="space-y-2" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Collection name"
                            />
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={2}
                              placeholder="Description (optional)"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={handleSaveEdit}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCollection(null)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-medium text-gray-900 truncate">{collection.name}</h3>
                            {collection.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{collection.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{collection.authors.length} creators</span>
                              <span>{formatDate(collection.createdAt)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {editingCollection !== collection.id && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCollection(collection);
                            }}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            title="Edit collection"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportCollectionAsCSV(collection);
                            }}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            title="Export as CSV"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollection(collection.id);
                            }}
                            className="p-1 rounded hover:bg-red-100 transition-colors"
                            title="Delete collection"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collection Details */}
          <div className="flex-1">
            {selectedCollection ? (
              <div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCollection.name}</h2>
                      {selectedCollection.description && (
                        <p className="text-gray-600 mt-2">{selectedCollection.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>{selectedCollection.authors.length} creators</span>
                        <span>Created {formatDate(selectedCollection.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => exportCollectionAsCSV(selectedCollection)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </button>
                  </div>
                </div>

                {selectedCollection.authors.length > 0 ? (
                  <div className="grid gap-4">
                    {selectedCollection.authors.map((author, index) => (
                      <div key={`${author.username}-${author.platform}-${index}`} className="relative">
                        <AuthorCard
                          author={author}
                          isSelected={false}
                          onToggleSelect={() => {}}
                          showFavoriteButton={false}
                        />
                        <button
                          onClick={() => handleRemoveFromCollection(author.username, author.platform)}
                          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-red-50 transition-colors group"
                          title="Remove from collection"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Collection is empty</h3>
                    <p className="text-gray-600 mb-6">
                      Add creators to this collection by searching and clicking the star icon.
                    </p>
                    <Link 
                      href="/"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Find Creators
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Collection</h3>
                <p className="text-gray-600">
                  Choose a collection from the sidebar to view and manage your saved creators.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}