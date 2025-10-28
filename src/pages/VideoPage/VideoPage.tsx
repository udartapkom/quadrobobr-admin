import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './VideoPage.module.scss';

interface Video {
  id: number;
  title: string;
  description?: string;
  videoUrl?: string;
  videoKey?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  videoType: 'UPLOAD' | 'YOUTUBE';
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function VideoPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    isActive: true,
    videoType: 'UPLOAD' as 'UPLOAD' | 'YOUTUBE',
    youtubeUrl: '',
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const response = await fetch('/api/videos/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Ошибка загрузки видео:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Пожалуйста, выберите видео файл');
      return;
    }

    if (!formData.title.trim()) {
      alert('Пожалуйста, укажите название видео');
      return;
    }

    setUploading(true);
    try {
      const token = auth.getToken();

      // 1. Загружаем файл в MinIO
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'videos');

      const uploadResponse = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Ошибка загрузки файла');
      }

      const uploadData = await uploadResponse.json();

      // 2. Загружаем превью, если есть
      let thumbnailUrl = '';
      let thumbnailKey = '';

      if (thumbnailFile) {
        const thumbFormData = new FormData();
        thumbFormData.append('file', thumbnailFile);
        thumbFormData.append('folder', 'thumbnails');

        const thumbResponse = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: thumbFormData,
        });

        if (thumbResponse.ok) {
          const thumbData = await thumbResponse.json();
          thumbnailUrl = thumbData.url;
          thumbnailKey = thumbData.key;
        }
      }

      // 3. Создаём запись в БД
      const createResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          videoUrl: uploadData.url,
          videoKey: uploadData.key,
          thumbnailUrl: thumbnailUrl || undefined,
          thumbnailKey: thumbnailKey || undefined,
          videoType: 'UPLOAD',
          order: formData.order,
          isActive: formData.isActive,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Ошибка создания записи');
      }

      const createdVideo = await createResponse.json();

      // 4. Если превью не было загружено - генерируем автоматически
      if (!thumbnailFile) {
        try {
          const thumbResponse = await fetch(`/api/videos/${createdVideo.id}/generate-thumbnail`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (!thumbResponse.ok) {
            const error = await thumbResponse.json();
            console.error('Ошибка генерации превью:', error);
          }
        } catch (err) {
          console.error('Не удалось сгенерировать превью:', err);
          // Не критичная ошибка, продолжаем
        }
      }

      // Сбрасываем форму
      setFormData({
        title: '',
        description: '',
        order: 0,
        isActive: true,
        videoType: 'UPLOAD',
        youtubeUrl: '',
      });
      setThumbnailFile(null);
      
      loadVideos();
      e.target.value = '';
      alert('Видео успешно загружено!');
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Ошибка загрузки видео');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateThumbnail = async (videoId: number) => {
    try {
      const token = auth.getToken();
      const response = await fetch(`/api/videos/${videoId}/generate-thumbnail`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации превью');
      }

      alert('Превью сгенерировано!');
      loadVideos();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка генерации превью. Убедитесь, что на сервере установлен ffmpeg.');
    }
  };

  const handleUploadThumbnail = async (videoId: number, file: File) => {
    try {
      const token = auth.getToken();

      // Загружаем превью
      const thumbFormData = new FormData();
      thumbFormData.append('file', file);
      thumbFormData.append('folder', 'thumbnails');

      const uploadResponse = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: thumbFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Ошибка загрузки превью');
      }

      const thumbData = await uploadResponse.json();

      // Обновляем видео
      const updateResponse = await fetch(`/api/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          thumbnailUrl: thumbData.url,
          thumbnailKey: thumbData.key,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Ошибка обновления видео');
      }

      alert('Превью загружено!');
      loadVideos();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка загрузки превью');
    }
  };

  const handleCreateYoutube = async () => {
    if (!formData.title.trim() || !formData.youtubeUrl.trim()) {
      alert('Пожалуйста, заполните название и ссылку на YouTube');
      return;
    }

    try {
      const token = auth.getToken();

      // Загружаем превью, если есть
      let thumbnailUrl = '';
      let thumbnailKey = '';

      if (thumbnailFile) {
        const thumbFormData = new FormData();
        thumbFormData.append('file', thumbnailFile);
        thumbFormData.append('folder', 'thumbnails');

        const thumbResponse = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: thumbFormData,
        });

        if (thumbResponse.ok) {
          const thumbData = await thumbResponse.json();
          thumbnailUrl = thumbData.url;
          thumbnailKey = thumbData.key;
        }
      }

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          youtubeUrl: formData.youtubeUrl,
          thumbnailUrl: thumbnailUrl || undefined,
          thumbnailKey: thumbnailKey || undefined,
          videoType: 'YOUTUBE',
          order: formData.order,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка создания видео');
      }

      setFormData({
        title: '',
        description: '',
        order: 0,
        isActive: true,
        videoType: 'UPLOAD',
        youtubeUrl: '',
      });
      setThumbnailFile(null);
      
      loadVideos();
      alert('YouTube видео добавлено!');
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка добавления видео');
    }
  };

  const handleUpdate = async (video: Video) => {
    try {
      const token = auth.getToken();
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          order: video.order,
          isActive: video.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления');
      }

      setEditingId(null);
      loadVideos();
    } catch (error) {
      console.error('Ошибка обновления:', error);
      alert('Ошибка обновления видео');
    }
  };

  const handleDelete = async (video: Video) => {
    if (!confirm(`Удалить видео "${video.title}"?`)) return;

    try {
      const token = auth.getToken();

      // 1. Удаляем запись из БД
      const deleteDbResponse = await fetch(`/api/videos/${video.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!deleteDbResponse.ok) {
        throw new Error('Ошибка удаления из БД');
      }

      // 2. Если это загруженный файл, удаляем из MinIO
      if (video.videoType === 'UPLOAD' && video.videoKey) {
        await fetch(`/api/media/file/${encodeURIComponent(video.videoKey)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // 3. Удаляем превью, если есть
      if (video.thumbnailKey) {
        await fetch(`/api/media/file/${encodeURIComponent(video.thumbnailKey)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      loadVideos();
      alert('Видео удалено!');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления видео');
    }
  };

  const startEdit = (video: Video) => {
    setEditingId(video.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    loadVideos();
  };

  const updateVideoField = (id: number, field: keyof Video, value: any) => {
    setVideos(videos.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.title}>Управление видео</h1>

        {/* Форма добавления */}
        <div className={styles.addForm}>
          <h2>Добавить видео</h2>
          
          <div className={styles.formGroup}>
            <label>Тип видео:</label>
            <select
              value={formData.videoType}
              onChange={(e) => setFormData({ ...formData, videoType: e.target.value as 'UPLOAD' | 'YOUTUBE' })}
            >
              <option value="UPLOAD">Загрузить файл</option>
              <option value="YOUTUBE">YouTube ссылка</option>
            </select>
          </div>

          <Input
            label="Название *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Название видео"
          />

          <div className={styles.formGroup}>
            <label>Описание:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание видео"
              rows={3}
            />
          </div>

          {formData.videoType === 'YOUTUBE' && (
            <Input
              label="Ссылка YouTube *"
              value={formData.youtubeUrl}
              onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          )}

          <div className={styles.formGroup}>
            <label>Превью (необязательно):</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            />
            {thumbnailFile && (
              <div className={styles.thumbnailPreview}>
                <img src={URL.createObjectURL(thumbnailFile)} alt="Preview" />
                <button onClick={() => setThumbnailFile(null)}>✕</button>
              </div>
            )}
            <small>Если не указано, превью будет сгенерировано автоматически</small>
          </div>

          <Input
            label="Порядок"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          />

          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Активно
            </label>
          </div>

          {formData.videoType === 'UPLOAD' ? (
            <label className={styles.uploadButton}>
              <Button as="span" disabled={uploading}>
                {uploading ? 'Загрузка...' : 'Загрузить файл'}
              </Button>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
          ) : (
            <Button onClick={handleCreateYoutube}>Добавить YouTube видео</Button>
          )}
        </div>

        {/* Список видео */}
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <div className={styles.videosList}>
            {videos.length === 0 ? (
              <div className={styles.empty}>Нет видео</div>
            ) : (
              videos.map((video) => (
                <div key={video.id} className={styles.videoCard}>
                  {editingId === video.id ? (
                    // Режим редактирования
                    <div className={styles.editForm}>
                      <Input
                        label="Название"
                        value={video.title}
                        onChange={(e) => updateVideoField(video.id, 'title', e.target.value)}
                      />
                      <div className={styles.formGroup}>
                        <label>Описание:</label>
                        <textarea
                          value={video.description || ''}
                          onChange={(e) => updateVideoField(video.id, 'description', e.target.value)}
                          rows={3}
                        />
                      </div>
                      <Input
                        label="Порядок"
                        type="number"
                        value={video.order}
                        onChange={(e) => updateVideoField(video.id, 'order', parseInt(e.target.value) || 0)}
                      />
                      <div className={styles.formGroup}>
                        <label>
                          <input
                            type="checkbox"
                            checked={video.isActive}
                            onChange={(e) => updateVideoField(video.id, 'isActive', e.target.checked)}
                          />
                          Активно
                        </label>
                      </div>
                      <div className={styles.editActions}>
                        <Button onClick={() => handleUpdate(video)}>Сохранить</Button>
                        <Button onClick={cancelEdit}>Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    // Режим просмотра
                    <>
                      <div className={styles.videoPreview}>
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt={video.title} className={styles.thumbnail} />
                        ) : video.videoType === 'UPLOAD' && video.videoUrl ? (
                          <video src={video.videoUrl} className={styles.videoPlayer} />
                        ) : video.videoType === 'YOUTUBE' && video.youtubeUrl ? (
                          <div className={styles.youtubePreview}>
                            <p>🎬 YouTube</p>
                          </div>
                        ) : (
                          <div className={styles.noPreview}>Нет превью</div>
                        )}
                      </div>
                      
                      <div className={styles.videoInfo}>
                        <h3>{video.title}</h3>
                        {video.description && <p>{video.description}</p>}
                        <div className={styles.videoMeta}>
                          <span>Тип: {video.videoType === 'UPLOAD' ? 'Файл' : 'YouTube'}</span>
                          <span>Порядок: {video.order}</span>
                          <span>Статус: {video.isActive ? '✅ Активно' : '❌ Неактивно'}</span>
                        </div>
                      </div>

                      <div className={styles.videoActions}>
                        {video.videoUrl && (
                          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                            Открыть видео
                          </a>
                        )}
                        
                        {video.videoType === 'UPLOAD' && video.videoKey && (
                          <Button onClick={() => handleGenerateThumbnail(video.id)}>
                            Генерировать превью
                          </Button>
                        )}
                        
                        <label className={styles.thumbnailUploadBtn}>
                          <Button as="span">Загрузить превью</Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadThumbnail(video.id, file);
                              e.target.value = '';
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>

                        <Button onClick={() => startEdit(video)}>Редактировать</Button>
                        <Button variant="danger" onClick={() => handleDelete(video)}>Удалить</Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
