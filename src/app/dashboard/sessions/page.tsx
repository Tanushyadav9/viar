import { redirect } from 'next/navigation';

export default function StudentSessionsRedirectPage() {
  redirect('/dashboard?tab=sessions');
}
