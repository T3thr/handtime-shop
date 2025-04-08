import { Inter } from "next/font/google";
import "./globals.css";
import mongodbConnect from "@/backend/lib/mongodb";
import { ThemeProvider } from "@/context/Theme";
import ChangeTheme from "@/components/layouts/ChangeTheme";
import { cookies } from "next/headers";
import { GlobalProvider } from "./GlobalProvider";
import Head from "next/head";
import CustomToast from './CustomToast';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Hand Time Shop",
  description: "Discover exquisite handcrafted products from Uttaradit, Thailand.",
  keywords: "Uttaradit handcrafts, Thai handicrafts, handmade products, traditional crafts",
  author: "Hand Time Shop",
  robots: "index, follow",
  openGraph: {
    title: "Hand Time Shop",
    description: "Explore unique handcrafted items from Uttaradit, Thailand.",
    url: "https://handtime-shop.vercel.app/",
    siteName: "Hand Time Shop",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hand Time Shop - Handcrafted Products from Uttaradit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hand Time Shop",
    description: "Explore unique handcrafted items from Uttaradit, Thailand.",
    image: "/images/twitter-card.jpg",
  },
};

export default async function RootLayout({ children }) {
  await mongodbConnect();

  const cookieStore = cookies();
  const themeCookie = cookieStore.get("theme");
  const initialTheme = themeCookie?.value || "light";

  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta name="author" content={metadata.author} />
        <meta name="robots" content={metadata.robots} />
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta property="og:description" content={metadata.openGraph.description} />
        <meta property="og:url" content={metadata.openGraph.url} />
        <meta property="og:site_name" content={metadata.openGraph.siteName} />
        <meta property="og:image" content={metadata.openGraph.images[0].url} />
        <meta property="og:image:width" content={metadata.openGraph.images[0].width} />
        <meta property="og:image:height" content={metadata.openGraph.images[0].height} />
        <meta name="twitter:card" content={metadata.twitter.card} />
        <meta name="twitter:title" content={metadata.twitter.title} />
        <meta name="twitter:description" content={metadata.twitter.description} />
        <meta name="twitter:image" content={metadata.twitter.image} />
      </Head>
      <html lang="en" className={initialTheme === "dark" ? "dark" : "light"}>
        <body className={inter.className}>
          <ThemeProvider initialTheme={initialTheme}>
            <CustomToast />
            <GlobalProvider>
              {children}
              <ChangeTheme />
            </GlobalProvider>
          </ThemeProvider>
          {/* Add script to disable right-click and dragging */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener('contextmenu', function(e) {
                  if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                    e.preventDefault();
                    alert('Right-click is disabled for images and videos.');
                  }
                });

                document.addEventListener('dragstart', function(e) {
                  if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                    e.preventDefault();
                  }
                });
              `,
            }}
          />
        </body>
      </html>
    </>
  );
}
