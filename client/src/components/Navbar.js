import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMessageSquare, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, isGuru, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const close = () => setOpen(false);

  const link = (to, label, icon) => (
    <Link
      to={to}
      onClick={close}
      className="hover:text-orange-200 flex items-center gap-1"
    >
      {icon}{label}
    </Link>
  );

  return (
    <nav className="bg-orange-600 text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2" onClick={close}>
            <span className="text-2xl font-bold">🕉️ Pariprashna</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {link('/questions', 'Questions')}
            {link('/tags', 'Tags')}
            {link('/gurus', 'Gurus')}
            {link('/users', 'Users')}
            {link('/chat', 'AI Chat', <FiMessageSquare />)}
            {link('/bounties', 'Bounties')}
            {isGuru() && link('/guru', 'Guru Portal')}
            {isAdmin() && link('/admin', 'Admin')}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/questions/ask" className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-100">
                  Ask Question
                </Link>
                <div className="flex items-center space-x-2">
                  <Link to={`/users/${user._id || user.id}`} className="flex items-center space-x-2 hover:text-orange-200">
                    <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:inline">{user.name}</span>
                  </Link>
                  <button onClick={handleLogout} className="hover:text-orange-200" title="Log out">
                    <FiLogOut />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="hover:text-orange-200">Login</Link>
                <Link to="/register" className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-100">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden p-2 hover:text-orange-200"
            aria-label="Toggle menu"
          >
            {open ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {open && (
          <div className="md:hidden bg-orange-600 border-t border-orange-500">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            {link('/questions', 'Questions')}
            {link('/tags', 'Tags')}
            {link('/gurus', 'Gurus')}
            {link('/users', 'Users')}
            {link('/chat', 'AI Chat', <FiMessageSquare />)}
            {link('/bounties', 'Bounties')}
            {isGuru() && link('/guru', 'Guru Portal')}
            {isAdmin() && link('/admin', 'Admin')}
            <div className="border-t border-orange-500 pt-3">
              {user ? (
                <>
                  <Link
                    to={`/users/${user._id || user.id}`}
                    onClick={close}
                    className="block py-1 text-sm"
                  >
                    {user.name} (Profile)
                  </Link>
                  <Link
                    to="/questions/ask"
                    onClick={close}
                    className="block bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-center mt-2"
                  >
                    Ask Question
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-2 text-sm"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/login" onClick={close} className="py-2">Login</Link>
                  <Link
                    to="/register"
                    onClick={close}
                    className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
