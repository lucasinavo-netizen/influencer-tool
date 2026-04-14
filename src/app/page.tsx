"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Author, SearchHistory, saveSearchHistory, getSearchHistory } from './lib/storage';
import { AuthorCard } from './components/AuthorCard';
import { SearchHistoryComponent } from './components/SearchHistory';
import { ErrorDisplay } from './components/ErrorDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "gaming", label: "Gaming" },
  { value: "casino", label: "Casino / Gambling" },
  { value: "beauty", label: "Beauty" },
  { value: "fashion", label: "Fashion" },
  { value: "fitness", label: "Fitness" },
  { value: "food", label: "Food" },
  { value: "travel", label: "Travel" },
  { value: "tech", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "music", label: "Music" },
  { value: "comedy", label: "Comedy" },
  { value: "sports", label: "Sports" },
  { value: "education", label: "Education" },
  { value: "lifestyle", label: "Lifestyle" },
];

const COUNTRIES = [
  { value: "", label: "All Regions" },
  { value: "colombia", label: "Colombia" },
  { value: "myanmar", label: "Myanmar" },
  { value: "taiwan", label: "Taiwan" },
  { value: "japan", label: "Japan" },
  { value: "korea", label: "South Korea" },
  { value: "thailand", label: "Thailand" },
  { value: "vietnam", label: "Vietnam" },
  { value: "philippines", label: "Philippines" },
  { value: "indonesia", label: "Indonesia" },
  { value: "mexico", label: "Mexico" },
  { value: "brazil", label: "Brazil" },
  { value: "argentina", label: "Argentina" },
  { value: "usa", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "spain", label: "Spain" },
  { value: "india", label: "India" },
];

const ENGAGEMENT_RANGES = [
  { value: "0", label: "Any" },
  { value: "1", label: ">= 1%" },
  { value: "2", label: ">= 2%" },
  { value: "3", label: ">= 3%" },
  { value: "5", label: ">= 5%" },
  { value: "10", label: ">= 10%" },
];

export default function Home() {
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [minEngagement, setMinEngagement] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(new Set());
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showingHistory, setShowingHistory] = useState(false);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
    setShowingHistory(true);
  }, []);

  // Show search results if we have them
  useEffect(() => {
    if (authors.length > 0 || error) {
      setShowingHistory(false);
    }
  }, [authors, error]);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null || num === 0) return "-";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  };

  const handleSearch = async (searchTerm?: string, fromHistory?: SearchHistory) => {
    let finalSearchTerm = searchTerm;
    let searchFilters: any = {
      minFollowers: parseInt(minFollowers) || 0,
      maxFollowers: parseInt(maxFollowers) || 0,
      minEngagement: parseFloat(minEngagement) || 0,
      category,
      country
    };

    // If loading from history, use those parameters
    if (fromHistory) {
      finalSearchTerm = fromHistory.searchTerm;
      searchFilters = fromHistory.filters;
      setPlatform(fromHistory.platform);
      setKeyword(fromHistory.searchTerm);
      setCategory(fromHistory.filters.category || "");
      setCountry(fromHistory.filters.country || "");
      setMinFollowers(fromHistory.filters.minFollowers?.toString() || "");
      setMaxFollowers(fromHistory.filters.maxFollowers?.toString() || "");
      setMinEngagement(fromHistory.filters.minEngagement?.toString() || "0");
      
      // Load cached results
      setAuthors(fromHistory.results);
      setTotalPosts(0); // We don't store this in history
      setSelectedAuthors(new Set());
      setError("");
      setShowingHistory(false);
      return;
    }

    // Build search term
    if (!finalSearchTerm) {
      const parts: string[] = [];
      if (keyword.trim()) parts.push(keyword.trim());
      if (category) parts.push(category);
      if (country) parts.push(country);
      
      if (parts.length === 0) {
        setError("Please enter a keyword or select a category.");
        return;
      }
      
      finalSearchTerm = parts.join(" ");
    }

    setLoading(true);
    setError("");
    setAuthors([]);
    setTotalPosts(0);
    setSelectedAuthors(new Set());
    setShowingHistory(false);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 300000);

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          keyword: finalSearchTerm,
          minFollowers: searchFilters.minFollowers,
          maxFollowers: searchFilters.maxFollowers,
          minEngagement: searchFilters.minEngagement,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return;
      }

      const results = json.data || [];
      setAuthors(results);
      setTotalPosts(json.totalPostsScraped || 0);

      // Save to search history (only if not from history reload)
      if (!fromHistory) {
        saveSearchHistory({
          searchTerm: finalSearchTerm,
          platform,
          timestamp: Date.now(),
          resultCount: results.length,
          results,
          filters: searchFilters
        });
        setSearchHistory(getSearchHistory());
      }

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setError("Search timed out, please try again");
      } else {
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromHistory = (historyItem: SearchHistory) => {
    handleSearch(undefined, historyItem);
  };

  const refreshHistory = () => {
    setSearchHistory(getSearchHistory());
  };

  const toggleSelect = (username: string) => {
    const next = new Set(selectedAuthors);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setSelectedAuthors(next);
  };

  const selectAll = () => {
    if (selectedAuthors.size === authors.length) {
      setSelectedAuthors(new Set());
    } else {
      setSelectedAuthors(new Set(authors.map((a) => a.username)));
    }
  };

  const exportCSV = (onlySelected = false) => {
    const list = onlySelected
      ? authors.filter((a) => selectedAuthors.has(a.username))
      : authors;
    if (list.length === 0) return;

    const headers = [
      "Username", "Name", "Platform", "Followers", "Engagement %", "Avg Likes",
      "Avg Comments", "Avg Plays", "Avg Shares", "Verified", "Total Posts",
      "Email", "External URL", "Business Category", "Bio", "Profile URL"
    ];
    const rows = list.map((a) => [
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
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `influencers-${keyword || category || "search"}-${platform}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNewSearch = () => {
    setAuthors([]);
    setError("");
    setShowingHistory(true);
    setSelectedAuthors(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">InfluencerFinder</h1>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              BETA
            </span>
          </div>
          <div className="flex items-center gap-4">
            {authors.length > 0 && (
              <span className="text-sm text-gray-600">
                {authors.length} creators found
              </span>
            )}
            <Link 
              href="/collections" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Collections
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setPlatform("tiktok")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    platform === "tiktok" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  TikTok
                </button>
                <button
                  onClick={() => setPlatform("instagram")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    platform === "instagram" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Instagram
                </button>
              </div>
            </div>

            {/* Keyword */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keyword / Hashtag</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. casino, beauty, gaming"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-4">
            {/* Min Followers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Followers</label>
              <input
                type="number"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Followers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Followers</label>
              <input
                type="number"
                value={maxFollowers}
                onChange={(e) => setMaxFollowers(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Min Engagement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Engagement Rate</label>
              <select
                value={minEngagement}
                onChange={(e) => setMinEngagement(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ENGAGEMENT_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "Searching..." : "Search Creators"}
              </button>
            </div>
          </div>

          {/* Reset and Clear */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setKeyword("");
                setCategory("");
                setCountry("");
                setMinFollowers("");
                setMaxFollowers("");
                setMinEngagement("0");
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Reset Filters
            </button>
            {(authors.length > 0 || error) && (
              <button
                onClick={handleNewSearch}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                New Search
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner platform={platform} />}

        {/* Error State */}
        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={() => handleSearch()}
            className="mb-6"
          />
        )}

        {/* Search History */}
        {showingHistory && searchHistory.length > 0 && !loading && (
          <SearchHistoryComponent 
            history={searchHistory}
            onLoadHistory={handleLoadFromHistory}
            onRefresh={refreshHistory}
          />
        )}

        {/* Results */}
        {authors.length > 0 && !loading && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Search Results ({authors.length})
                </h2>
                {totalPosts > 0 && (
                  <span className="text-sm text-gray-600">
                    from {totalPosts.toLocaleString()} posts analyzed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedAuthors.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedAuthors.size} selected
                  </span>
                )}
                
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedAuthors.size === authors.length ? "Deselect All" : "Select All"}
                </button>

                <div className="relative group">
                  <button className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                    Export
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block min-w-[150px] z-10 py-1">
                    <button 
                      onClick={() => exportCSV(false)} 
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Export All ({authors.length})
                    </button>
                    {selectedAuthors.size > 0 && (
                      <button 
                        onClick={() => exportCSV(true)} 
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Export Selected ({selectedAuthors.size})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid gap-4">
              {authors.map((author, index) => (
                <AuthorCard
                  key={`${author.username}-${author.platform}-${index}`}
                  author={author}
                  isSelected={selectedAuthors.has(author.username)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State - No History */}
        {showingHistory && searchHistory.length === 0 && !loading && !error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Your Perfect Influencers</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Search for creators on TikTok and Instagram using keywords, categories, or regions. 
              Filter by follower count and engagement rates to find the perfect match for your campaigns.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Pro Tip:</strong> Start with broad keywords like "beauty" or "gaming" to discover trending creators, 
                then narrow down with specific hashtags.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}