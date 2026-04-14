import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform = 'instagram', keyword = '', minFollowers, maxFollowers, minEngagement } = body;
    
    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      return NextResponse.json({ 
        error: "Missing Google API credentials. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in your environment variables." 
      }, { status: 500 });
    }

    // 1. 組合 Google Dorking 搜尋語法
    const site = platform.toLowerCase() === 'tiktok' ? 'tiktok.com' : 'instagram.com';
    let query = `site:${site}`;
    
    if (keyword) query += ` "${keyword}"`;
    
    // 尋找 Email 後綴
    query += ` ("@gmail.com" OR "@yahoo.com" OR "@hotmail.com" OR "@outlook.com")`;

    // 2. 呼叫 Google Custom Search API
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=10`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error("Google API Error:", data.error);
      return NextResponse.json({ error: "Google API Error: " + data.error.message }, { status: 500 });
    }

    // 3. 處理與萃取資料
    const results = data.items || [];
    const extractedInfluencers = [];
    
    // Email 正規表示式
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

    for (const item of results) {
      const snippet = item.snippet || '';
      const title = item.title || '';
      const link = item.link || '';
      
      // 從 snippet 中萃取 Email
      const emails = snippet.match(emailRegex) || [];
      const uniqueEmails = [...new Set(emails.map((e: string) => e.toLowerCase()))];
      
      if (uniqueEmails.length > 0) {
        // 從網址萃取帳號 ID
        let username = "Unknown";
        if (platform === 'instagram') {
          const match = link.match(/instagram\.com\/([^/?]+)/);
          if (match && match[1] && match[1] !== 'p' && match[1] !== 'reel') username = match[1];
        } else {
          const match = link.match(/tiktok\.com\/@([^/?]+)/);
          if (match && match[1]) username = match[1];
        }

        extractedInfluencers.push({
          id: Math.random().toString(36).substr(2, 9),
          username: username,
          name: title.split(' - ')[0].replace(/Instagram|TikTok|(@.*)/gi, '').trim(),
          platform: platform,
          followers: Math.floor(Math.random() * (100000 - 10000) + 10000), // 模擬假資料
          engagement: (Math.random() * 5 + 1).toFixed(2), // 模擬假資料
          emails: uniqueEmails,
          profileUrl: link,
          snippet: snippet,
          contactCount: uniqueEmails.length,
          followersCount: Math.floor(Math.random() * (100000 - 10000) + 10000),
          engagementRate: (Math.random() * 5 + 1).toFixed(2),
        });
      }
    }

    // 根據前端需要的格式回傳
    return NextResponse.json({
        data: extractedInfluencers,
        totalPostsScraped: results.length
    });
    
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
