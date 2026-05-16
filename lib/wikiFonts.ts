import localFont from "next/font/local";

/** Wikipedia article title / section heading font (Linux Libertine). */
export const wikiTitleFont = localFont({
  src: [
    {
      path: "../app/fonts/LinLibertine_R.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../app/fonts/LinLibertine_RB.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-linux-libertine",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "Times", "serif"],
});
