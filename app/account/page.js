// app/dashboard/page.jsx
import { getServerSession } from 'next-auth';
import options from '@/app/api/auth/[...nextauth]/options';
import Dashboard from '@/components/contents/Dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(options);
  
  return <Dashboard session={session} />;
}