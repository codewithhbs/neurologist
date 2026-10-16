import { FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title }) {
  const { admin, logout } = useAuth();
  return (
    <header className="bg-white border-b sticky top-0 z-10 px-4 lg:px-8 py-4 flex items-center justify-between">
      <h1 className="text-lg lg:text-xl font-bold text-slate-900">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
            <FiUser />
          </div>
          <div>
            <p className="font-medium text-slate-800">{admin?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{admin?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-outline !px-3"><FiLogOut /></button>
      </div>
    </header>
  );
}
