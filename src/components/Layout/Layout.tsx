import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../utils/auth';
import { Button } from '../../ui-kit';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = auth.getAdmin();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const loadUnreadCount = async () => {
    try {
      const token = auth.getToken();
      const response = await fetch('/api/contact-forms/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const count = await response.json();
      setUnreadCount(count);
    } catch (error) {
      console.error('Ошибка загрузки счетчика:', error);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    
    const handleMessagesUpdate = () => {
      loadUnreadCount();
    };

    window.addEventListener('messagesUpdate', handleMessagesUpdate);
    
    return () => {
      window.removeEventListener('messagesUpdate', handleMessagesUpdate);
    };
  }, []);

  const menuItems = [
    { path: '/admin/photos', label: 'Фото' },
    { path: '/admin/video', label: 'Видео' },
    { path: '/admin/sliders', label: 'Слайдеры' },
    { path: '/admin/gallery', label: 'Галерея' },
    { path: '/admin/reviews', label: 'Отзывы' },
    { path: '/admin/messages', label: 'Сообщения', badge: unreadCount },
    { path: '/admin/faq', label: 'Вопрос-ответ' },
    { path: '/admin/users', label: 'Пользователи' },
    { path: '/admin/seo', label: 'SEO' },
    { path: '/admin/telegram', label: 'Телеграм' },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoPlaceholder}>LOGO</div>
          <h1 className={styles.brandName}>Квадробобр</h1>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.active : ''
              }`}
            >
              {item.label}&nbsp;
              {item.badge && item.badge > 0 && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className={styles.user}>
          <div className={styles.userName}>
            {admin?.firstName} {admin?.lastName}
          </div>
          <div className={styles.userEmail}>{admin?.email}</div>
          <Button variant="danger" onClick={handleLogout} fullWidth>
            Выйти
          </Button>
        </div>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}

