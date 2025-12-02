import React, { useState } from 'react';
import HomePage from './HomePage';
import ThreeDEditor from './ThreeDEditor';

/**
 * Main App Component
 * Routes between HomePage and 3D Editor
 */
function App() {
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return <ThreeDEditor onBackToHome={() => setShowEditor(false)} />;
  }

  return <HomePage onStart={() => setShowEditor(true)} />;
}

export default App;
