// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import mongodbConnect from "@/backend/lib/mongodb";
import { ThemeProvider } from "@/context/Theme";
import ChangeTheme from "@/components/layouts/ChangeTheme";
import { cookies } from "next/headers";
import { GlobalProvider } from "./GlobalProvider";
import CustomToast from "./CustomToast";

// Font setup
const inter = Inter({ subsets: ["latin"] });

// metadata 
export const metadata = {
  title: "Hand Time Shop",
  description: "Discover exquisite handcrafted products from Uttaradit, Thailand.",
  keywords: "Uttaradit handcrafts, Thai handicrafts, handmade products, traditional crafts",
  authors: [{ name: "Hand Time Shop" }],
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
    images: ["/images/twitter-card.jpg"],
  },
};

export default async function RootLayout({ children }) {
  await mongodbConnect();

  const cookieStore = cookies();
  const themeCookie = cookieStore.get("theme");
  const initialTheme = themeCookie?.value || "light";

  return (
    <html lang="en" className={initialTheme === "dark" ? "dark" : "light"}>
      <body className={inter.className}>
        <ThemeProvider initialTheme={initialTheme}>
          <CustomToast />
          <GlobalProvider>
            {children}
            <ChangeTheme />
          </GlobalProvider>
        </ThemeProvider>

        {/* You can alternatively use next/script for this kind of thing */}
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
  );
}
