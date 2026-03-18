import { redirect } from 'next/navigation';

export default function LegacySigninAliasPage() {
  redirect('/auth/signin');
}
