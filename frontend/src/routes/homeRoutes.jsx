import React, {lazy} from 'react';

const HomeContent = lazy(() => import('#pages/Home/HomeContent/HomeContent.jsx'));
const MainLayout = lazy(() => import('#layouts/MainLayout/MainLayout'));

function homeRoutes() {
  return [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        {
          path: '',
          element: <HomeContent />
        }
      ]
    }
  ];
}

export default homeRoutes;