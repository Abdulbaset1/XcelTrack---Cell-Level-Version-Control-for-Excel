import React from 'react';

const EditorToolbar: React.FC = () => {
  return (
    <div className="bg-gray-100 p-4 flex space-x-2">
      <button className="px-3 py-2 bg-blue-500 text-white rounded">Save</button>
      <button className="px-3 py-2 bg-gray-500 text-white rounded">Undo</button>
      {/* Add your toolbar buttons here */}
    </div>
  );
};

export default EditorToolbar; // ← ADD THIS LINE