
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Level1_Home from './pages/Level1_Home';
import Level2_Category from './pages/Level2_Category';
import Level3_Work from './pages/Level3_Work';
import Level4_Topic from './pages/Level4_Topic';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          {/* Default redirect to our primary Level 1 page */}
          <Route path="/" element={<Navigate to="/essay-example" replace />} />
          
          {/* Level 1: Main Pillar Page */}
          <Route path="/essay-example" element={<Level1_Home />} />
          
          {/* Level 2: Category Hub */}
          <Route path="/essay-example/:categorySlug" element={<Level2_Category />} />
          
          {/* Level 3: Subject/Work Page */}
          <Route path="/essay-example/:categorySlug/:workSlug" element={<Level3_Work />} />
          
          {/* Level 4: Deep Topic Analysis */}
          <Route path="/essay-example/:categorySlug/:workSlug/:topicSlug" element={<Level4_Topic />} />

          {/* Fallback */}
          <Route path="*" element={<div className="text-center py-20">404 - Page Not Found</div>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
