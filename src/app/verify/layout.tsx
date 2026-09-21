import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Student Certificate | Credential Verification | Viar.in',
  description:
    'Public lookup and instant cryptographic verification of official graduation certificates issued by Viar.in and Acharya Niraj Kumar.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
