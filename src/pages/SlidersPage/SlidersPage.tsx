import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './SlidersPage.module.scss';

interface Slider {
  id: number;
  title: string;
  description?: string;
  images: string[];
  imageKeys: string[];
  sliderType: 'MAIN' | 'ABOUT' | 'SERVICES';
  order: number;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  metaTitle?: string;
  metaAlt?: string;
}

interface PhotoFile {
  name: string;
  url: string;
  size: number;
}

export default function SlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Partial<Slider> | null>(null);
  const [selectedImages, setSelectedImages] = useState<PhotoFile[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as string[],
    imageKeys: [] as string[],
    sliderType: 'MAIN' as const,
    order: 0,
    buttonText: '',
    buttonLink: '',
    metaTitle: '',
    metaAlt: '',
    isActive: true,
  });

  useEffect(() => {
    loadSliders();
  }, []);

  const loadSliders = async () => {
    try {
      const token = auth.getToken();
      const response = await fetch('/api/sliders/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSliders(data);
    } catch (error) {
      console.error('Ошибка загрузки слайдеров:', error);
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
    if (editingSlider?.id && formData.images.length > 0) {
      // Создаем preselected из текущих изображений слайдера
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

  const handleCreateSlider = () => {
    setEditingSlider({});
    setSelectedImages([]);
    setFormData({
      title: '',
      description: '',
      images: [],
      imageKeys: [],
      sliderType: 'MAIN',
      order: sliders.length,
      buttonText: '',
      buttonLink: '',
      metaTitle: '',
      metaAlt: '',
      isActive: true,
    });
  };

  const handleEditSlider = (slider: Slider) => {
    setEditingSlider(slider);
    setSelectedImages([]);
    setFormData({
      title: slider.title,
      description: slider.description || '',
      images: slider.images,
      imageKeys: slider.imageKeys,
      sliderType: slider.sliderType as any,
      order: slider.order,
      buttonText: slider.buttonText || '',
      buttonLink: slider.buttonLink || '',
      metaTitle: slider.metaTitle || '',
      metaAlt: slider.metaAlt || '',
      isActive: slider.isActive,
    });
  };

  const handleSaveSlider = async () => {
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
      const url = editingSlider?.id ? `/api/sliders/${editingSlider.id}` : '/api/sliders';
      const method = editingSlider?.id ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      setEditingSlider(null);
      setSelectedImages([]);
      loadSliders();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const handleDeleteSlider = async (id: number) => {
    if (!confirm('Удалить слайдер?')) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/sliders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadSliders();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Слайдеры</h1>
          <Button onClick={handleCreateSlider}>Добавить слайдер</Button>
        </div>

        <div className={styles.slidersList}>
          {sliders.map((slider) => (
            <div key={slider.id} className={styles.sliderCard}>
              <div className={styles.sliderImages}>
                {slider.images.slice(0, 3).map((img, idx) => (
                  <img key={idx} src={img} alt={slider.title} />
                ))}
                {slider.images.length > 3 && (
                  <div className={styles.moreImages}>+{slider.images.length - 3}</div>
                )}
              </div>
              <div className={styles.sliderInfo}>
                <h3>{slider.title}</h3>
                <p>{slider.description}</p>
                <div className={styles.meta}>
                  <span className={styles.badge}>{slider.sliderType}</span>
                  <span>Изображений: {slider.images.length}</span>
                  <span>Порядок: {slider.order}</span>
                  <span className={slider.isActive ? styles.active : styles.inactive}>
                    {slider.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
              <div className={styles.sliderActions}>
                <Button onClick={() => handleEditSlider(slider)}>Редактировать</Button>
                <Button variant="danger" onClick={() => handleDeleteSlider(slider.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}

          {sliders.length === 0 && (
            <div className={styles.empty}>Нет слайдеров</div>
          )}
        </div>

        {editingSlider && (
          <div className={styles.modal} onClick={() => setEditingSlider(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingSlider.id ? 'Редактировать слайдер' : 'Новый слайдер'}</h2>

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
                    <label>Тип слайдера</label>
                    <select
                      className={styles.select}
                      value={formData.sliderType}
                      onChange={(e) =>
                        setFormData({ ...formData, sliderType: e.target.value as any })
                      }
                    >
                      <option value="MAIN">Главная</option>
                      <option value="ABOUT">О нас</option>
                      <option value="SERVICES">Услуги</option>
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
                  <Input
                    label="Текст кнопки"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="Подробнее"
                  />

                  <Input
                    label="Ссылка кнопки"
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    placeholder="/about"
                  />
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
                  <Button onClick={handleSaveSlider}>Сохранить</Button>
                  <Button variant="danger" onClick={() => setEditingSlider(null)}>
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

