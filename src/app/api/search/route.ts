import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Allow up to 5 minutes
export const dynamic = "force-dynamic";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;

async function runApifyActor(actorId: string, input: Record<string, unknown>) {
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
  if (!datasetId) {
    throw new Error("Apify 執行失敗");
  }

  // Wait a bit if still running
  if (startData?.data?.status !== "SUCCEEDED") {
    // Poll for completion
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const checkRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${startData.data.id}?token=${APIFY_TOKEN}`
      );
      const checkData = await checkRes.json();
      if (checkData?.data?.status === "SUCCEEDED") break;
      if (checkData?.data?.status === "FAILED" || checkData?.data?.status === "ABORTED") {
        throw new Error("Apify 執行失敗: " + checkData?.data?.status);
      }
    }
  }

  const resultRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=500`
  );
  return resultRes.json();
}

interface AuthorProfile {
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

function extractEmails(text: string): string[] {
  if (!text) return [];
  const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  return text.match(re) || [];
}

function aggregateTikTokAuthors(posts: Record<string, unknown>[]): AuthorProfile[] {
  const authorMap = new Map<string, { posts: Record<string, unknown>[]; meta: Record<string, unknown> }>();

  for (const post of posts) {
    const am = post.authorMeta as Record<string, unknown> | undefined;
    if (!am || !am.name) continue;
    const name = am.name as string;
    if (!authorMap.has(name)) {
      authorMap.set(name, { posts: [], meta: am });
    }
    authorMap.get(name)!.posts.push(post);
  }

  const authors: AuthorProfile[] = [];
  for (const [username, data] of authorMap) {
    const { posts: authorPosts, meta } = data;
    const totalPlays = authorPosts.reduce((s, p) => s + ((p.playCount as number) || 0), 0);
    const totalLikesPost = authorPosts.reduce((s, p) => s + ((p.diggCount as number) || 0), 0);
    const totalComments = authorPosts.reduce((s, p) => s + ((p.commentCount as number) || 0), 0);
    const totalShares = authorPosts.reduce((s, p) => s + ((p.shareCount as number) || 0), 0);
    const count = authorPosts.length;
    const followers = (meta.fans as number) || 0;

    const topPost = authorPosts.reduce((best, p) =>
      ((p.playCount as number) || 0) > ((best.playCount as number) || 0) ? p : best
    , authorPosts[0]);

    authors.push({
      username,
      nickname: (meta.nickName as string) || username,
      avatar: (meta.avatar as string) || "",
      followers,
      following: (meta.following as number) || 0,
      totalLikes: (meta.heart as number) || 0,
      totalVideos: (meta.video as number) || 0,
      verified: (meta.verified as boolean) || false,
      avgPlays: Math.round(totalPlays / count),
      avgLikes: Math.round(totalLikesPost / count),
      avgComments: Math.round(totalComments / count),
      avgShares: Math.round(totalShares / count),
      engagementRate: followers > 0
        ? parseFloat((((totalLikesPost + totalComments + totalShares) / count / followers) * 100).toFixed(2))
        : 0,
      postCount: count,
      topPost: ((topPost.text as string) || "").slice(0, 80),
      topPostUrl: (topPost.webVideoUrl as string) || "",
      platform: "tiktok",
      profileUrl: `https://www.tiktok.com/@${username}`,
      bio: ((meta.signature as string) || "").trim(),
      email: extractEmails((meta.signature as string) || "").join(", "),
      externalUrl: "",
      businessCategory: "",
      isBusinessAccount: false,
    });
  }

  return authors.sort((a, b) => b.followers - a.followers);
}

function aggregateIGAuthors(posts: Record<string, unknown>[]): AuthorProfile[] {
  const authorMap = new Map<string, Record<string, unknown>[]>();

  for (const post of posts) {
    const username = (post.ownerUsername as string) || "";
    if (!username) continue;
    if (!authorMap.has(username)) {
      authorMap.set(username, []);
    }
    authorMap.get(username)!.push(post);
  }

  const authors: AuthorProfile[] = [];
  for (const [username, authorPosts] of authorMap) {
    const first = authorPosts[0];
    const totalLikesPost = authorPosts.reduce((s, p) => s + ((p.likesCount as number) || 0), 0);
    const totalComments = authorPosts.reduce((s, p) => s + ((p.commentsCount as number) || 0), 0);
    const count = authorPosts.length;

    // IG hashtag scraper doesn't return follower counts
    // Use followersCount if available, otherwise 0
    const followers = (first.followersCount as number) || 0;

    const topPost = authorPosts.reduce((best, p) =>
      ((p.likesCount as number) || 0) > ((best.likesCount as number) || 0) ? p : best
    , authorPosts[0]);

    // For IG hashtag results, use avg likes as a proxy for sorting when no follower data
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
      engagementRate: followers > 0
        ? parseFloat((((totalLikesPost + totalComments) / count / followers) * 100).toFixed(2))
        : 0,
      postCount: count,
      topPost: ((topPost.caption as string) || "").slice(0, 80),
      topPostUrl: (topPost.url as string) || "",
      platform: "instagram",
      profileUrl: `https://www.instagram.com/${username}/`,
      bio: "",
      email: "",
      externalUrl: "",
      businessCategory: "",
      isBusinessAccount: false,
    });
  }

  // Sort by avg likes when no follower data available
  return authors.sort((a, b) => {
    if (a.followers > 0 || b.followers > 0) return b.followers - a.followers;
    return b.avgLikes - a.avgLikes;
  });
}

export async function POST(req: NextRequest) {
  try {
    const { platform, keyword, minFollowers, maxFollowers, minEngagement } = await req.json();

    if (!keyword) {
      return NextResponse.json({ error: "請輸入搜尋關鍵字" }, { status: 400 });
    }

    let posts;
    let authors: AuthorProfile[];

    if (platform === "tiktok") {
      const hashtag = keyword.replace(/\s+/g, "").replace("#", "");
      posts = await runApifyActor("clockworks~tiktok-scraper", {
        hashtags: [hashtag],
        resultsPerPage: 100,
      });
      authors = aggregateTikTokAuthors(posts);
    } else {
      const hashtag = keyword.replace(/\s+/g, "").replace("#", "");
      posts = await runApifyActor("apify~instagram-hashtag-scraper", {
        hashtags: [hashtag],
        resultsLimit: 50,
        tagPostsType: "recent",
      });
      // Filter out error results
      if (Array.isArray(posts)) {
        posts = posts.filter((p: Record<string, unknown>) => !p.error);
      }
      authors = aggregateIGAuthors(posts);

      // Step 2: Enrich with profile data (followers, verified, bio)
      if (authors.length > 0) {
        try {
          const usernames = authors.slice(0, 30).map((a) => a.username); // max 30 to save credits
          const profileUrls = usernames.map((u) => `https://www.instagram.com/${u}/`);
          const profiles = await runApifyActor("apify~instagram-scraper", {
            directUrls: profileUrls,
            resultsType: "details",
            resultsLimit: profileUrls.length,
          });

          if (Array.isArray(profiles)) {
            const profileMap = new Map<string, Record<string, unknown>>();
            for (const p of profiles) {
              const uname = (p.username as string) || "";
              if (uname) profileMap.set(uname, p);
            }

            for (const author of authors) {
              const profile = profileMap.get(author.username);
              if (profile) {
                author.followers = (profile.followersCount as number) || 0;
                author.following = (profile.followingCount as number) || (profile.followsCount as number) || 0;
                author.totalVideos = (profile.postsCount as number) || author.totalVideos;
                author.verified = (profile.verified as boolean) || false;
                author.avatar = (profile.profilePicUrl as string) || (profile.profilePicUrlHD as string) || author.avatar;
                author.nickname = (profile.fullName as string) || author.nickname;
                // Bio, links, business info
                const bio = (profile.biography as string) || "";
                author.bio = bio;
                author.email = extractEmails(bio).join(", ");
                author.externalUrl = (profile.externalUrl as string) || "";
                author.businessCategory = (profile.businessCategoryName as string) || "";
                author.isBusinessAccount = (profile.isBusinessAccount as boolean) || false;
                // Recalculate engagement rate
                if (author.followers > 0) {
                  author.engagementRate = parseFloat(
                    (((author.avgLikes + author.avgComments) / author.followers) * 100).toFixed(2)
                  );
                }
              }
            }

            // Re-sort with real follower data
            authors.sort((a, b) => b.followers - a.followers);
          }
        } catch (e) {
          // Profile enrichment failed, continue with basic data
          console.error("Profile enrichment failed:", e);
        }
      }
    }

    // Apply filters (skip follower/engagement filters if data not available)
    const hasFollowerData = authors.some((a) => a.followers > 0);
    if (hasFollowerData) {
      if (minFollowers && minFollowers > 0) {
        authors = authors.filter((a) => a.followers >= minFollowers);
      }
      if (maxFollowers && maxFollowers > 0) {
        authors = authors.filter((a) => a.followers <= maxFollowers);
      }
      if (minEngagement && minEngagement > 0) {
        authors = authors.filter((a) => a.engagementRate >= minEngagement);
      }
    }

    return NextResponse.json({
      data: authors,
      totalPostsScraped: Array.isArray(posts) ? posts.length : 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
