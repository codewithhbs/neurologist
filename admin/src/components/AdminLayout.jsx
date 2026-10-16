import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout({ title, children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar title={title} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
