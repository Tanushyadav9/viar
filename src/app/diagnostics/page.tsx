import { redirect } from 'next/navigation';

export default function DiagnosticsRedirect() {
  redirect('/admin/diagnostics');
}
