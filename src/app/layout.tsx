import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfluencerFinder - TikTok & Instagram Creator Discovery Tool",
  description: "Find and analyze TikTok and Instagram creators. Search by keywords, filter by followers and engagement rates. Export contact details and save to collections.",
  keywords: "influencer marketing, creator discovery, TikTok influencers, Instagram influencers, social media marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 font-sans">{children}</body>
    </html>
  );
}