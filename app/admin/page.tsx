import { AdminUpload } from '@/components/AdminUpload';

export const metadata = {
  title: 'Admin — Chausse Selections',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASS ?? 'chausse-admin';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <AdminUpload adminPass={adminPass} />
    </div>
  );
}
