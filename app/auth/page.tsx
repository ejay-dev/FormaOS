import { redirect } from 'next/navigation';

export default function AuthRootPage() {
  // Redirect /auth root to the signup page (keeps marketing CTAs valid)
  redirect('/auth/signup');
}
