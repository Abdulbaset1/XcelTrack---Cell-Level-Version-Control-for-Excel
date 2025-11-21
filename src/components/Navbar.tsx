import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="text-xl font-bold text-gray-800">XcelTrack</div>
          {/* Add your navbar content here */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; // ← ADD THIS LINE