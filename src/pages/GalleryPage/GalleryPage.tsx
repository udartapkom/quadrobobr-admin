import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './GalleryPage.module.scss';

interface GalleryItem {
  id: number;
  title: string;
  description?: string;
  images: string[];
  imageKeys: string[];
  category: 'QUADROBIKES' | 'NATURE' | 'EVENTS' | 'REVIEWS';
  order: number;
  isFeatured: boolean;
  isActive: boolean;
  metaTitle?: string;
  metaAlt?: string;
}

interface PhotoFile {
  name: string;
  url: string;
  size: number;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<GalleryItem> | null>(null);
  const [selectedImages, setSelectedImages] = useState<PhotoFile[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as string[],
    imageKeys: [] as string[],
    category: 'QUADROBIKES' as const,
    order: 0,
    isFeatured: false,
    metaTitle: '',
    metaAlt: '',
    isActive: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const token = auth.getToken();
      const response = await fetch('/api/gallery/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Ошибка загрузки галереи:', error);
    }
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const response = await fetch('/api/media/list?prefix=photos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const imageFiles = (data.files || []).filter((file: PhotoFile) =>
        file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      setPhotos(imageFiles);
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenImagePicker = async () => {
    setShowImagePicker(true);
    await loadPhotos();
    
    // При редактировании показываем уже выбранные изображения
    if (editingItem?.id && formData.images.length > 0) {
      const preselected = formData.images.map((url, idx) => ({
        name: formData.imageKeys[idx],
        url: url,
        size: 0,
      }));
      setSelectedImages(preselected);
    }
  };

  const handleToggleImage = (photo: PhotoFile) => {
    const isSelected = selectedImages.some(img => img.name === photo.name);
    if (isSelected) {
      setSelectedImages(selectedImages.filter(img => img.name !== photo.name));
    } else {
      setSelectedImages([...selectedImages, photo]);
    }
  };

  const handleConfirmImages = () => {
    if (selectedImages.length > 0) {
      setFormData({
        ...formData,
        images: selectedImages.map(img => img.url),
        imageKeys: selectedImages.map(img => img.name),
      });
    }
    setShowImagePicker(false);
  };

  const handleCreateItem = () => {
    setEditingItem({});
    setSelectedImages([]);
    setFormData({
      title: '',
      description: '',
      images: [],
      imageKeys: [],
      category: 'QUADROBIKES',
      order: items.length,
      isFeatured: false,
      metaTitle: '',
      metaAlt: '',
      isActive: true,
    });
  };

  const handleEditItem = (item: GalleryItem) => {
    setEditingItem(item);
    setSelectedImages([]);
    setFormData({
      title: item.title,
      description: item.description || '',
      images: item.images,
      imageKeys: item.imageKeys,
      category: item.category as any,
      order: item.order,
      isFeatured: item.isFeatured,
      metaTitle: item.metaTitle || '',
      metaAlt: item.metaAlt || '',
      isActive: item.isActive,
    });
  };

  const handleSaveItem = async () => {
    if (!formData.title) {
      alert('Заполните заголовок');
      return;
    }

    if (formData.images.length === 0) {
      alert('Выберите хотя бы одно изображение');
      return;
    }

    try {
      const token = auth.getToken();
      const url = editingItem?.id ? `/api/gallery/${editingItem.id}` : '/api/gallery';
      const method = editingItem?.id ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      setEditingItem(null);
      setSelectedImages([]);
      loadItems();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Удалить из галереи?')) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadItems();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const categoryNames = {
    QUADROBIKES: 'Квадроциклы',
    NATURE: 'Природа',
    EVENTS: 'Мероприятия',
    REVIEWS: 'Отзывы',
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Галерея</h1>
          <Button onClick={handleCreateItem}>Добавить в галерею</Button>
        </div>

        <div className={styles.slidersList}>
          {items.map((item) => (
            <div key={item.id} className={styles.sliderCard}>
              <div className={styles.sliderImages}>
                {item.images.slice(0, 3).map((img, idx) => (
                  <img key={idx} src={img} alt={item.title} />
                ))}
                {item.images.length > 3 && (
                  <div className={styles.moreImages}>+{item.images.length - 3}</div>
                )}
              </div>
              <div className={styles.sliderInfo}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className={styles.meta}>
                  <span className={styles.badge}>{categoryNames[item.category]}</span>
                  <span>Изображений: {item.images.length}</span>
                  {item.isFeatured && <span>⭐ Избранное</span>}
                  <span className={item.isActive ? styles.active : styles.inactive}>
                    {item.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
              <div className={styles.sliderActions}>
                <Button onClick={() => handleEditItem(item)}>Редактировать</Button>
                <Button variant="danger" onClick={() => handleDeleteItem(item.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className={styles.empty}>Нет элементов</div>
          )}
        </div>

        {editingItem && (
          <div className={styles.modal} onClick={() => setEditingItem(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingItem.id ? 'Редактировать' : 'Добавить в галерею'}</h2>

              <div className={styles.form}>
                <Input
                  label="Заголовок *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Заголовок слайдера"
                />

                <div className={styles.inputGroup}>
                  <label>Описание</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Описание слайдера"
                    rows={3}
                  />
                </div>

                <div className={styles.imageSelector}>
                  <label>Изображения * (можно выбрать несколько)</label>
                  {formData.images.length > 0 ? (
                    <div className={styles.selectedImagesGrid}>
                      {formData.images.map((img, idx) => (
                        <div key={idx} className={styles.selectedImageThumb}>
                          <img src={img} alt="" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <Button onClick={handleOpenImagePicker}>
                    {formData.images.length > 0 
                      ? `Выбрано: ${formData.images.length}. Изменить`
                      : 'Выбрать изображения'}
                  </Button>
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>Категория</label>
                    <select
                      className={styles.select}
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as any })
                      }
                    >
                      <option value="QUADROBIKES">Квадроциклы</option>
                      <option value="NATURE">Природа</option>
                      <option value="EVENTS">Мероприятия</option>
                      <option value="REVIEWS">Отзывы</option>
                    </select>
                  </div>

                  <Input
                    label="Порядок"
                    type="number"
                    value={formData.order.toString()}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) =>
                          setFormData({ ...formData, isFeatured: e.target.checked })
                        }
                      />
                      {' '}Избранное
                    </label>
                  </div>
                </div>

                <div className={styles.row}>
                  <Input
                    label="Meta Title"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="SEO заголовок"
                  />

                  <Input
                    label="Meta Alt"
                    value={formData.metaAlt}
                    onChange={(e) => setFormData({ ...formData, metaAlt: e.target.value })}
                    placeholder="Alt текст изображения"
                  />
                </div>

                <div className={styles.checkbox}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive">Активен</label>
                </div>

              <div className={styles.modalActions}>
                <Button onClick={handleSaveItem}>Сохранить</Button>
                <Button variant="danger" onClick={() => setEditingItem(null)}>
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
              <h2>Выбрать изображения (выбрано: {selectedImages.length})</h2>
              {loading ? (
                <div className={styles.loading}>Загрузка...</div>
              ) : (
                <div className={styles.photoGrid}>
                  {photos.map((photo) => {
                    const isSelected = selectedImages.some(img => img.name === photo.name);
                    return (
                      <div
                        key={photo.name}
                        className={`${styles.photoItem} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleToggleImage(photo)}
                      >
                        <img src={photo.url} alt={photo.name} />
                        {isSelected && <div className={styles.checkmark}>✓</div>}
                      </div>
                    );
                  })}
                  {photos.length === 0 && (
                    <div className={styles.empty}>Нет фото. Загрузите в разделе "Фото"</div>
                  )}
                </div>
              )}
              <div className={styles.modalActions}>
                {selectedImages.length > 0 && (
                  <Button onClick={handleConfirmImages}>
                    Подтвердить ({selectedImages.length})
                  </Button>
                )}
                <Button variant="danger" onClick={() => setShowImagePicker(false)}>
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

