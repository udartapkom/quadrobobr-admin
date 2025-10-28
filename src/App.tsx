import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import PhotoPage from './pages/PhotoPage';
import VideoPage from './pages/VideoPage';
import SlidersPage from './pages/SlidersPage';
import GalleryPage from './pages/GalleryPage';
import ReviewsPage from './pages/ReviewsPage';
import MessagesPage from './pages/MessagesPage';
import TelegramPage from './pages/TelegramPage';
import FaqPage from './pages/FaqPage';
import UsersPage from './pages/UsersPage';
import SeoPage from './pages/SeoPage';
import { auth } from './utils/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return auth.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/photos"
          element={
            <PrivateRoute>
              <PhotoPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/video"
          element={
            <PrivateRoute>
              <VideoPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/sliders"
          element={
            <PrivateRoute>
              <SlidersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/gallery"
          element={
            <PrivateRoute>
              <GalleryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <PrivateRoute>
              <ReviewsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <PrivateRoute>
              <MessagesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/telegram"
          element={
            <PrivateRoute>
              <TelegramPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/faq"
          element={
            <PrivateRoute>
              <FaqPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/seo"
          element={
            <PrivateRoute>
              <SeoPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/admin" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

