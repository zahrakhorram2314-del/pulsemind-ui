import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'PulseMind AI - Cognitive UX Assistant',
  description: 'Cognitive UX incident assistant applying Miller\'s Law and Explainable AI (XAI/SHAP) to reduce analyst cognitive load during critical system alerts.',
  openGraph: {
    title: 'PulseMind AI - Cognitive UX Assistant',
    description: 'Cognitive UX incident assistant applying Miller\'s Law and Explainable AI (XAI/SHAP) to reduce analyst cognitive load during critical system alerts.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseMind AI - Cognitive UX Assistant',
    description: 'Cognitive UX incident assistant applying Miller\'s Law and Explainable AI (XAI/SHAP) to reduce analyst cognitive load during critical system alerts.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
