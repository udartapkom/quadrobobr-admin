import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './ReviewsPage.module.scss';

interface Review {
  id: number;
  title: string;
  authorName: string;
  rating: number;
  text: string;
  tripDate?: string;
  routeName?: string;
  photoUrl?: string;
  photoKey?: string;
  isApproved: boolean;
  isActive: boolean;
}

interface PhotoFile {
  name: string;
  url: string;
  size: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingReview, setEditingReview] = useState<Partial<Review> | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    authorName: '',
    rating: 5,
    text: '',
    tripDate: '',
    routeName: '',
    photoUrl: '',
    photoKey: '',
    isApproved: false,
    isActive: true,
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const token = auth.getToken();
      const response = await fetch('/api/reviews/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
    }
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const response = await fetch('/api/media/list?prefix=photos/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPhotos(data.files || []);
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenImagePicker = async () => {
    setShowImagePicker(true);
    await loadPhotos();
  };

  const handleSelectImage = (photo: PhotoFile) => {
    setFormData({
      ...formData,
      photoUrl: photo.url,
      photoKey: photo.name,
    });
    setShowImagePicker(false);
  };

  const handleCreateReview = () => {
    setEditingReview({});
    setFormData({
      title: '',
      authorName: '',
      rating: 5,
      text: '',
      tripDate: '',
      routeName: '',
      photoUrl: '',
      photoKey: '',
      isApproved: false,
      isActive: true,
    });
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setFormData({
      title: review.title,
      authorName: review.authorName,
      rating: review.rating,
      text: review.text,
      tripDate: review.tripDate ? new Date(review.tripDate).toISOString().split('T')[0] : '',
      routeName: review.routeName || '',
      photoUrl: review.photoUrl || '',
      photoKey: review.photoKey || '',
      isApproved: review.isApproved,
      isActive: review.isActive,
    });
  };

  const handleSaveReview = async () => {
    if (!formData.title || !formData.authorName || !formData.text) {
      alert('Заполните обязательные поля');
      return;
    }

    try {
      const token = auth.getToken();
      const url = editingReview?.id ? `/api/reviews/${editingReview.id}` : '/api/reviews';
      const method = editingReview?.id ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        tripDate: formData.tripDate ? new Date(formData.tripDate).toISOString() : null,
      };

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setEditingReview(null);
      loadReviews();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadReviews();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Отзывы</h1>
          <Button onClick={handleCreateReview}>Добавить отзыв</Button>
        </div>

        <div className={styles.reviewsList}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              {review.photoUrl && (
                <div className={styles.reviewPhoto}>
                  <img src={review.photoUrl} alt={review.title} />
                </div>
              )}
              <div className={styles.reviewInfo}>
                <h3>{review.title}</h3>
                <p className={styles.author}>{review.authorName}</p>
                <div className={styles.rating}>{'⭐'.repeat(review.rating)}</div>
                <p className={styles.text}>{review.text}</p>
                {review.routeName && <p className={styles.route}>Маршрут: {review.routeName}</p>}
                {review.tripDate && (
                  <p className={styles.date}>
                    Дата поездки: {new Date(review.tripDate).toLocaleDateString('ru-RU')}
                  </p>
                )}
                <div className={styles.meta}>
                  <span className={review.isApproved ? styles.approved : styles.pending}>
                    {review.isApproved ? 'Одобрен' : 'На модерации'}
                  </span>
                  <span className={review.isActive ? styles.active : styles.inactive}>
                    {review.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
              <div className={styles.reviewActions}>
                <Button onClick={() => handleEditReview(review)}>Редактировать</Button>
                <Button variant="danger" onClick={() => handleDeleteReview(review.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className={styles.empty}>Нет отзывов</div>
          )}
        </div>

        {editingReview && (
          <div className={styles.modal} onClick={() => setEditingReview(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingReview.id ? 'Редактировать отзыв' : 'Новый отзыв'}</h2>

              <div className={styles.form}>
                <Input
                  label="Заголовок *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Отличная поездка!"
                />

                <Input
                  label="Автор *"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="Иван Иванов"
                />

                <div className={styles.inputGroup}>
                  <label>Текст отзыва *</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="Расскажите о впечатлениях..."
                    rows={5}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>Рейтинг</label>
                    <select
                      className={styles.select}
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: Number(e.target.value) })
                      }
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4)</option>
                      <option value={3}>⭐⭐⭐ (3)</option>
                      <option value={2}>⭐⭐ (2)</option>
                      <option value={1}>⭐ (1)</option>
                    </select>
                  </div>

                  <Input
                    label="Дата поездки"
                    type="date"
                    value={formData.tripDate}
                    onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                  />
                </div>

                <Input
                  label="Название маршрута"
                  value={formData.routeName}
                  onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                  placeholder="Лесная тропа"
                />

                <div className={styles.imageSelector}>
                  <label>Фото (опционально)</label>
                  {formData.photoUrl && (
                    <div className={styles.selectedImage}>
                      <img src={formData.photoUrl} alt="" />
                      <Button
                        variant="danger"
                        onClick={() => setFormData({ ...formData, photoUrl: '', photoKey: '' })}
                      >
                        Удалить
                      </Button>
                    </div>
                  )}
                  {!formData.photoUrl && (
                    <Button onClick={handleOpenImagePicker}>Выбрать фото</Button>
                  )}
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.isApproved}
                        onChange={(e) =>
                          setFormData({ ...formData, isApproved: e.target.checked })
                        }
                      />
                      {' '}Одобрен
                    </label>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                      />
                      {' '}Активен
                    </label>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <Button onClick={handleSaveReview}>Сохранить</Button>
                  <Button variant="danger" onClick={() => setEditingReview(null)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showImagePicker && (
          <div className={styles.modal} onClick={() => setShowImagePicker(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Выбрать фото</h2>
              {loading ? (
                <p>Загрузка...</p>
              ) : (
                <div className={styles.imageGrid}>
                  {photos.map((photo) => (
                    <div
                      key={photo.name}
                      className={styles.imageItem}
                      onClick={() => handleSelectImage(photo)}
                    >
                      <img src={photo.url} alt={photo.name} />
                    </div>
                  ))}
                </div>
              )}
              <Button variant="danger" onClick={() => setShowImagePicker(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


