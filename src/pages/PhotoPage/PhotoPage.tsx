import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './PhotoPage.module.scss';

interface MediaFile {
  name: string;
  size: number;
  lastModified: Date;
  url: string;
}

interface Folder {
  name: string;
  path: string;
}

export default function PhotoPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState('photos');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const response = await fetch(`/api/media/list?prefix=${currentFolder}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      // Фильтруем только изображения
      const imageFiles = (data.files || []).filter((file: MediaFile) =>
        file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)
      );
      
      setFiles(imageFiles);
      setFolders(data.folders || []);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем что это изображение
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', currentFolder);

      const token = auth.getToken();
      await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      loadFiles();
      e.target.value = '';
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Удалить файл ${filename}?`)) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/media/file/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadFiles();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const token = auth.getToken();
      const folderPath = `${currentFolder}/${newFolderName}`;

      await fetch('/api/media/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderPath }),
      });

      setNewFolderName('');
      setShowNewFolder(false);
      loadFiles();
    } catch (error) {
      console.error('Ошибка создания папки:', error);
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    if (!confirm(`Удалить папку ${folderPath} и все фото в ней?`)) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/media/folder/${encodeURIComponent(folderPath)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Если удалили текущую папку, вернуться к photos
      if (folderPath === currentFolder) {
        setCurrentFolder('photos');
      } else {
        loadFiles();
      }
    } catch (error) {
      console.error('Ошибка удаления папки:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Фото</h1>
          <div className={styles.actions}>
            <Button onClick={() => setShowNewFolder(true)}>Создать папку</Button>
            <label className={styles.uploadButton}>
              <Button as="span" disabled={uploading}>
                {uploading ? 'Загрузка...' : 'Загрузить фото'}
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {currentFolder !== 'photos' && (
          <div className={styles.breadcrumb}>
            <button onClick={() => setCurrentFolder('photos')} className={styles.breadcrumbItem}>
              Фото
            </button>
            {currentFolder.split('/').filter(p => p && p !== 'photos').map((part, idx, arr) => (
              <span key={idx}>
                <span className={styles.separator}>/</span>
                <button
                  onClick={() => setCurrentFolder('photos/' + arr.slice(0, idx + 1).join('/'))}
                  className={styles.breadcrumbItem}
                >
                  {part}
                </button>
              </span>
            ))}
          </div>
        )}

        {showNewFolder && (
          <div className={styles.newFolder}>
            <Input
              label="Название папки"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="images"
            />
            <div className={styles.newFolderActions}>
              <Button onClick={handleCreateFolder}>Создать</Button>
              <Button variant="danger" onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
              }}>
                Отмена
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <div className={styles.grid}>
            {folders
              .filter(f => f.path.startsWith('photos/') && f.path !== 'photos')
              .map((folder) => (
              <div key={folder.path} className={styles.folderCard}>
                <div
                  className={styles.folderContent}
                  onClick={() => setCurrentFolder(folder.path)}
                >
                  <div className={styles.folderIcon}>📁</div>
                  <div className={styles.folderName}>{folder.name.split('/').pop()}</div>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.path);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {files.map((file) => (
              <div key={file.name} className={styles.fileCard}>
                <div className={styles.filePreview}>
                  {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={file.url} alt={file.name} className={styles.thumbnail} />
                  ) : file.name.match(/\.(mp4|webm|mov)$/i) ? (
                    <div className={styles.videoIcon}>🎬</div>
                  ) : (
                    <div className={styles.fileIcon}>📄</div>
                  )}
                </div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.name.split('/').pop()}</div>
                  <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                </div>
                <div className={styles.fileActions}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                    Открыть
                  </a>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteFile(file.name)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && files.length === 0 && folders.filter(f => f.path.startsWith('photos/')).length === 0 && (
          <div className={styles.empty}>Нет фото</div>
        )}
      </div>
    </Layout>
  );
}

