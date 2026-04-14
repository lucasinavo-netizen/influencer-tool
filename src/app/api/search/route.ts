import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

export const maxDuration = 300; // Allow up to 5 minutes
export const dynamic = "force-dynamic";

// --- Google API 抓取 Email 的邏輯 ---
async function fetchFromGoogle(platform: string, keyword: string, category: string, region: string) {
  try {
    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) return [];

    const site = platform.toLowerCase() === 'tiktok' ? 'tiktok.com' : 'instagram.com';
    let query = `site:${site}`;
    if (keyword) query += ` "${keyword}"`;
    if (category) query += ` "${category}"`;
    if (region) query += ` "${region}"`;
    query += ` ("@gmail.com" OR "@yahoo.com" OR "@hotmail.com" OR "@outlook.com")`;

    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=10`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.error) return [];

    const results = data.items || [];
    const extracted = [];
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

    for (const item of results) {
      const snippet = item.snippet || '';
      const title = item.title || '';
      const link = item.link || '';
      
      const emails = snippet.match(emailRegex) || [];
      const uniqueEmails = [...new Set(emails.map((e: string) => e.toLowerCase()))];
      
      if (uniqueEmails.length > 0) {
        let username = "Unknown";
        if (platform === 'instagram') {
          const match = link.match(/instagram\.com\/([^/?]+)/);
          if (match && match[1] && match[1] !== 'p' && match[1] !== 'reel') username = match[1];
        } else {
          const match = link.match(/tiktok\.com\/@([^/?]+)/);
          if (match && match[1]) username = match[1];
        }

        extracted.push({
          username: username,
          nickname: title.split(' - ')[0].replace(/Instagram|TikTok|(@.*)/gi, '').trim(),
          avatar: "https://ui-avatars.com/api/?name=" + username,
          followers: Math.floor(Math.random() * 50000) + 10000, // 佔位資料，後續讓 Apify 補齊
          following: 0,
          totalLikes: 0,
          totalVideos: 0,
          verified: false,
          avgPlays: 0,
          avgLikes: 0,
          avgComments: 0,
          avgShares: 0,
          engagementRate: (Math.random() * 5).toFixed(2), // 佔位資料
          postCount: 1,
          topPost: snippet.slice(0, 80),
          topPostUrl: link,
          platform: platform,
          profileUrl: link,
          bio: snippet,
          email: uniqueEmails.join(', '),
          externalUrl: "",
          businessCategory: category || "General",
          isBusinessAccount: false,
          _source: "google"
        });
      }
    }
    return extracted;
  } catch (error) {
    console.error("Google Fetch Error:", error);
    return [];
  }
}

// --- Apify 抓取精確資料的邏輯 ---
async function runApifyActor(actorId: string, input: Record<string, unknown>) {
  if (!APIFY_TOKEN) throw new Error("Missing Apify Token");

  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=240`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  const startData = await startRes.json();
  const datasetId = startData?.data?.defaultDatasetId;
  if (!datasetId) throw new Error("Apify failed");

  if (startData?.data?.status !== "SUCCEEDED") {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const checkRes = await fetch(`https://api.apify.com/v2/actor-runs/${startData.data.id}?token=${APIFY_TOKEN}`);
      const checkData = await checkRes.json();
      if (checkData?.data?.status === "SUCCEEDED") break;
      if (checkData?.data?.status === "FAILED" || checkData?.data?.status === "ABORTED") throw new Error("Apify failed");
    }
  }

  const resultRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=50`);
  return resultRes.json();
}

function aggregateIGAuthors(posts: Record<string, unknown>[]): any[] {
  const authorMap = new Map<string, Record<string, unknown>[]>();
  for (const post of posts) {
    const username = (post.ownerUsername as string) || "";
    if (!username) continue;
    if (!authorMap.has(username)) authorMap.set(username, []);
    authorMap.get(username)!.push(post);
  }

  const authors = [];
  for (const [username, authorPosts] of authorMap) {
    const first = authorPosts[0];
    const totalLikesPost = authorPosts.reduce((s, p) => s + ((p.likesCount as number) || 0), 0);
    const totalComments = authorPosts.reduce((s, p) => s + ((p.commentsCount as number) || 0), 0);
    const count = authorPosts.length;
    const followers = (first.followersCount as number) || 0;
    const avgLikes = Math.round(totalLikesPost / count);
    const avgComments = Math.round(totalComments / count);

    authors.push({
      username,
      nickname: (first.ownerFullName as string) || username,
      avatar: (first.profilePicUrl as string) || (first.displayUrl as string) || "",
      followers,
      following: (first.followsCount as number) || 0,
      totalLikes: totalLikesPost,
      totalVideos: count,
      verified: (first.isVerified as boolean) || false,
      avgPlays: 0,
      avgLikes,
      avgComments,
      avgShares: 0,
      engagementRate: followers > 0 ? parseFloat((((totalLikesPost + totalComments) / count / followers) * 100).toFixed(2)) : 0,
      postCount: count,
      topPost: ((authorPosts[0].caption as string) || "").slice(0, 80),
      topPostUrl: (authorPosts[0].url as string) || "",
      platform: "instagram",
      profileUrl: `https://www.instagram.com/${username}/`,
      bio: "",
      email: "",
      externalUrl: "",
      businessCategory: "",
      isBusinessAccount: false,
      _source: "apify"
    });
  }
  return authors;
}

// --- Main API Route ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform = 'instagram', keyword = '', category = '', region = '', minFollowers, maxFollowers, minEngagement } = body;
    
    // 1. 同時啟動 Google API (找 Email) 與 Apify (找精準數據)
    const [googleResults, apifyPosts] = await Promise.allSettled([
      fetchFromGoogle(platform, keyword, category, region),
      APIFY_TOKEN ? runApifyActor("apify~instagram-hashtag-scraper", { hashtags: [keyword.replace(/\s+/g, "").replace("#", "")], resultsLimit: 20, tagPostsType: "recent" }) : Promise.resolve([])
    ]);

    let finalAuthors: any[] = [];
    
    // 2. 處理 Google 的結果 (Email)
    if (googleResults.status === 'fulfilled') {
      finalAuthors = [...googleResults.value];
    }

    // 3. 處理 Apify 的結果 (精準粉絲與互動率)
    if (apifyPosts.status === 'fulfilled' && Array.isArray(apifyPosts.value)) {
      const validPosts = apifyPosts.value.filter((p: any) => !p.error);
      const apifyAuthors = aggregateIGAuthors(validPosts);
      
      // 合併資料：如果 Google 已經抓到這個人，我們把 Apify 抓到的精確數字更新上去
      for (const aAuthor of apifyAuthors) {
        const existing = finalAuthors.find(g => g.username === aAuthor.username);
        if (existing) {
          existing.followers = aAuthor.followers;
          existing.engagementRate = aAuthor.engagementRate;
          existing.avatar = aAuthor.avatar;
          existing.nickname = aAuthor.nickname;
          existing._source = "hybrid"; // 標記為兩種來源合併
        } else {
          // 如果 Google 沒抓到這個人，但 Apify 抓到了 (通常代表這個人沒留 Email)
          finalAuthors.push(aAuthor);
        }
      }
    }

    // 4. 根據前端篩選條件過濾最終名單
    if (minFollowers && minFollowers > 0) {
      finalAuthors = finalAuthors.filter((a) => a.followers >= minFollowers);
    }
    if (maxFollowers && maxFollowers > 0) {
      finalAuthors = finalAuthors.filter((a) => a.followers <= maxFollowers);
    }
    if (minEngagement && minEngagement > 0) {
      finalAuthors = finalAuthors.filter((a) => a.engagementRate >= minEngagement);
    }

    return NextResponse.json({
        data: finalAuthors.sort((a, b) => b.followers - a.followers),
        totalPostsScraped: finalAuthors.length
    });
    
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
