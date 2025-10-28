import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './SeoPage.module.scss';

interface SeoData {
  page: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  googleAnalyticsId?: string;
  yandexMetrikaId?: string;
}

const pages = [
  { value: 'home', label: 'Главная' },
  { value: 'about', label: 'О нас' },
  { value: 'services', label: 'Услуги' },
  { value: 'gallery', label: 'Галерея' },
  { value: 'reviews', label: 'Отзывы' },
  { value: 'contacts', label: 'Контакты' },
  { value: 'faq', label: 'Вопрос-ответ' },
];

export default function SeoPage() {
  const [selectedPage, setSelectedPage] = useState('home');
  const [seoData, setSeoData] = useState<SeoData>({
    page: 'home',
    robotsIndex: true,
    robotsFollow: true,
    twitterCard: 'summary_large_image',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSeoData(selectedPage);
  }, [selectedPage]);

  const loadSeoData = async (page: string) => {
    try {
      const response = await fetch(`/api/seo/${page}`);
      if (response.ok) {
        const data = await response.json();
        setSeoData(data);
      } else {
        // Страница не найдена, устанавливаем значения по умолчанию
        setSeoData({
          page,
          robotsIndex: true,
          robotsFollow: true,
          twitterCard: 'summary_large_image',
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки SEO:', error);
    }
  };

  const handleSave = async () => {
    try {
      const token = auth.getToken();
      await fetch(`/api/seo/${selectedPage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(seoData),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения SEO настроек');
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>SEO настройки</h1>
          <Button onClick={handleSave}>
            {saved ? '✓ Сохранено' : 'Сохранить'}
          </Button>
        </div>

        <div className={styles.pageSelector}>
          <label>Выберите страницу:</label>
          <div className={styles.pageTabs}>
            {pages.map((page) => (
              <button
                key={page.value}
                className={selectedPage === page.value ? styles.active : ''}
                onClick={() => setSelectedPage(page.value)}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2>Основные мета-теги</h2>
            <div className={styles.form}>
              <Input
                label="Meta Title"
                value={seoData.metaTitle || ''}
                onChange={(e) => setSeoData({ ...seoData, metaTitle: e.target.value })}
                placeholder="QuadroBoBR - Прокат квадроциклов"
              />

              <div className={styles.inputGroup}>
                <label>Meta Description</label>
                <textarea
                  className={styles.textarea}
                  value={seoData.metaDescription || ''}
                  onChange={(e) => setSeoData({ ...seoData, metaDescription: e.target.value })}
                  placeholder="Описание страницы для поисковых систем (до 160 символов)"
                  rows={3}
                />
                <span className={styles.hint}>
                  {(seoData.metaDescription || '').length}/160 символов
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label>Meta Keywords</label>
                <textarea
                  className={styles.textarea}
                  value={seoData.metaKeywords || ''}
                  onChange={(e) => setSeoData({ ...seoData, metaKeywords: e.target.value })}
                  placeholder="квадроциклы, прокат, аренда, активный отдых"
                  rows={2}
                />
              </div>

              <Input
                label="Canonical URL"
                value={seoData.canonicalUrl || ''}
                onChange={(e) => setSeoData({ ...seoData, canonicalUrl: e.target.value })}
                placeholder="https://quadrobobr.ru/about"
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>Open Graph (соцсети)</h2>
            <div className={styles.form}>
              <Input
                label="OG Title"
                value={seoData.ogTitle || ''}
                onChange={(e) => setSeoData({ ...seoData, ogTitle: e.target.value })}
                placeholder="Заголовок при репосте в соцсетях"
              />

              <div className={styles.inputGroup}>
                <label>OG Description</label>
                <textarea
                  className={styles.textarea}
                  value={seoData.ogDescription || ''}
                  onChange={(e) => setSeoData({ ...seoData, ogDescription: e.target.value })}
                  placeholder="Описание при репосте"
                  rows={3}
                />
              </div>

              <Input
                label="OG Image URL"
                value={seoData.ogImage || ''}
                onChange={(e) => setSeoData({ ...seoData, ogImage: e.target.value })}
                placeholder="https://quadrobobr.ru/og-image.jpg"
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>Twitter Card</h2>
            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Twitter Card Type</label>
                <select
                  className={styles.select}
                  value={seoData.twitterCard || 'summary_large_image'}
                  onChange={(e) => setSeoData({ ...seoData, twitterCard: e.target.value })}
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                  <option value="app">App</option>
                  <option value="player">Player</option>
                </select>
              </div>

              <Input
                label="Twitter Title"
                value={seoData.twitterTitle || ''}
                onChange={(e) => setSeoData({ ...seoData, twitterTitle: e.target.value })}
                placeholder="Заголовок для Twitter"
              />

              <div className={styles.inputGroup}>
                <label>Twitter Description</label>
                <textarea
                  className={styles.textarea}
                  value={seoData.twitterDescription || ''}
                  onChange={(e) => setSeoData({ ...seoData, twitterDescription: e.target.value })}
                  placeholder="Описание для Twitter"
                  rows={2}
                />
              </div>

              <Input
                label="Twitter Image URL"
                value={seoData.twitterImage || ''}
                onChange={(e) => setSeoData({ ...seoData, twitterImage: e.target.value })}
                placeholder="https://quadrobobr.ru/twitter-image.jpg"
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>Индексация</h2>
            <div className={styles.form}>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={seoData.robotsIndex}
                    onChange={(e) => setSeoData({ ...seoData, robotsIndex: e.target.checked })}
                  />
                  {' '}Разрешить индексацию (robots: index)
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={seoData.robotsFollow}
                    onChange={(e) => setSeoData({ ...seoData, robotsFollow: e.target.checked })}
                  />
                  {' '}Разрешить переход по ссылкам (robots: follow)
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Аналитика</h2>
            <div className={styles.form}>
              <Input
                label="Google Analytics ID"
                value={seoData.googleAnalyticsId || ''}
                onChange={(e) => setSeoData({ ...seoData, googleAnalyticsId: e.target.value })}
                placeholder="G-XXXXXXXXXX или UA-XXXXXXXXX-X"
              />

              <Input
                label="Яндекс.Метрика ID"
                value={seoData.yandexMetrikaId || ''}
                onChange={(e) => setSeoData({ ...seoData, yandexMetrikaId: e.target.value })}
                placeholder="12345678"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}







