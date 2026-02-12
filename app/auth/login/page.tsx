import { redirect } from 'next/navigation';

export default function LegacyLoginAliasPage() {
  redirect('/auth/signin');
}
