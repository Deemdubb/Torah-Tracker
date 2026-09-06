import { Route, Routes } from 'react-router-dom';
import AdminHome from './AdminHome';
import AdminCategory from './AdminCategory';
import AdminBook from './AdminBook';
import AdminAliyot from './AdminAliyot';
import AdminTools from './AdminTools';
import NotFoundPage from '@/pages/NotFoundPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminHome />} />
      <Route path="c/:catKey" element={<AdminCategory />} />
      <Route path="b/:bookKey" element={<AdminBook />} />
      <Route path="aliyot" element={<AdminAliyot />} />
      <Route path="tools" element={<AdminTools />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
