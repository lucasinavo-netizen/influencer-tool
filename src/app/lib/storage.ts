export interface Author {
  username: string;
  nickname: string;
  avatar: string;
  followers: number;
  following: number;
  totalLikes: number;
  totalVideos: number;
  verified: boolean;
  avgPlays: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  engagementRate: number;
  postCount: number;
  topPost: string;
  topPostUrl: string;
  platform: string;
  profileUrl: string;
  bio: string;
  email: string;
  externalUrl: string;
  businessCategory: string;
  isBusinessAccount: boolean;
}

export interface SearchHistory {
  id: string;
  searchTerm: string;
  platform: "tiktok" | "instagram";
  timestamp: number;
  resultCount: number;
  results: Author[];
  filters: {
    minFollowers?: number;
    maxFollowers?: number;
    minEngagement?: number;
    category?: string;
    country?: string;
  };
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  authors: Author[];
}

// Search History Management
export const saveSearchHistory = (search: Omit<SearchHistory, 'id'>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getSearchHistory();
    const newSearch: SearchHistory = {
      ...search,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    
    const updated = [newSearch, ...history].slice(0, 50); // Keep last 50 searches
    localStorage.setItem('influencer-search-history', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

export const getSearchHistory = (): SearchHistory[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('influencer-search-history');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
};

export const deleteSearchHistory = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getSearchHistory();
    const updated = history.filter(search => search.id !== id);
    localStorage.setItem('influencer-search-history', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete search history:', error);
  }
};

export const clearSearchHistory = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('influencer-search-history');
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};

// Collections Management
export const saveCollection = (collection: Omit<Collection, 'id' | 'createdAt'>): string => {
  if (typeof window === 'undefined') return '';
  
  try {
    const collections = getCollections();
    const newCollection: Collection = {
      ...collection,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    
    const updated = [...collections, newCollection];
    localStorage.setItem('influencer-collections', JSON.stringify(updated));
    return newCollection.id;
  } catch (error) {
    console.error('Failed to save collection:', error);
    return '';
  }
};

export const getCollections = (): Collection[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('influencer-collections');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load collections:', error);
    return [];
  }
};

export const updateCollection = (id: string, updates: Partial<Collection>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const collections = getCollections();
    const index = collections.findIndex(c => c.id === id);
    if (index !== -1) {
      collections[index] = { ...collections[index], ...updates };
      localStorage.setItem('influencer-collections', JSON.stringify(collections));
    }
  } catch (error) {
    console.error('Failed to update collection:', error);
  }
};

export const deleteCollection = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const collections = getCollections();
    const updated = collections.filter(c => c.id !== id);
    localStorage.setItem('influencer-collections', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete collection:', error);
  }
};

export const addToCollection = (collectionId: string, author: Author): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const collections = getCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      // Check if author already exists in collection
      if (!collection.authors.find(a => a.username === author.username && a.platform === author.platform)) {
        collection.authors.push(author);
        localStorage.setItem('influencer-collections', JSON.stringify(collections));
      }
    }
  } catch (error) {
    console.error('Failed to add to collection:', error);
  }
};

export const removeFromCollection = (collectionId: string, authorUsername: string, platform: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const collections = getCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      collection.authors = collection.authors.filter(
        a => !(a.username === authorUsername && a.platform === platform)
      );
      localStorage.setItem('influencer-collections', JSON.stringify(collections));
    }
  } catch (error) {
    console.error('Failed to remove from collection:', error);
  }
};

export const exportCollectionAsCSV = (collection: Collection): void => {
  const headers = [
    "Username", "Name", "Platform", "Followers", "Engagement %", "Avg Likes",
    "Avg Comments", "Avg Plays", "Avg Shares", "Verified", "Total Posts",
    "Email", "External URL", "Business Category", "Bio", "Profile URL"
  ];
  
  const rows = collection.authors.map(a => [
    a.username,
    `"${a.nickname.replace(/"/g, '""')}"`,
    a.platform,
    a.followers,
    a.engagementRate,
    a.avgLikes,
    a.avgComments,
    a.avgPlays,
    a.avgShares,
    a.verified ? "Yes" : "No",
    a.totalVideos,
    a.email || "",
    a.externalUrl || "",
    a.businessCategory || "",
    `"${(a.bio || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
    a.profileUrl,
  ]);
  
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${collection.name}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};