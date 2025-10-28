import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './UsersPage.module.scss';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'ADMIN' as const,
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = auth.getToken();
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const handleCreate = () => {
    setEditingUser({});
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'ADMIN',
      isActive: true,
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Пароль не показываем
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role as any,
      isActive: user.isActive,
    });
  };

  const handleSave = async () => {
    if (!formData.email) {
      alert('Введите email');
      return;
    }

    if (!editingUser?.id && !formData.password) {
      alert('Введите пароль для нового пользователя');
      return;
    }

    try {
      const token = auth.getToken();
      const url = editingUser?.id ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser?.id ? 'PUT' : 'POST';

      // Если редактируем и пароль пустой - не отправляем его
      const payload: any = { ...formData };
      if (editingUser?.id && !formData.password) {
        delete payload.password;
      }

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения пользователя');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadUsers();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления пользователя');
    }
  };

  const roleNames = {
    SUPER_ADMIN: 'Супер Админ',
    ADMIN: 'Админ',
    EDITOR: 'Редактор',
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Пользователи</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={() => setPasswordModalOpen(true)}>Сменить пароль</Button>
            <Button onClick={handleCreate}>Добавить пользователя</Button>
          </div>
        </div>

        <div className={styles.usersList}>
          {users.map((user) => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <h3>
                  {user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : user.email}
                </h3>
                <p className={styles.email}>{user.email}</p>
                <div className={styles.meta}>
                  <span className={styles.roleBadge}>{roleNames[user.role]}</span>
                  <span className={user.isActive ? styles.active : styles.inactive}>
                    {user.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                  <span className={styles.date}>
                    Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
              <div className={styles.userActions}>
                <Button onClick={() => handleEdit(user)}>Редактировать</Button>
                <Button variant="danger" onClick={() => handleDelete(user.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className={styles.empty}>Нет пользователей</div>
          )}
        </div>

        {editingUser && (
          <div className={styles.modal} onClick={() => setEditingUser(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingUser.id ? 'Редактировать пользователя' : 'Новый пользователь'}</h2>

              <div className={styles.form}>
                <Input
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                />

                <Input
                  label={editingUser.id ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль *'}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />

                <div className={styles.row}>
                  <Input
                    label="Имя"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Иван"
                  />

                  <Input
                    label="Фамилия"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Иванов"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Роль</label>
                  <select
                    className={styles.select}
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as any })
                    }
                  >
                    <option value="SUPER_ADMIN">Супер Админ</option>
                    <option value="ADMIN">Админ</option>
                    <option value="EDITOR">Редактор</option>
                  </select>
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

                <div className={styles.modalActions}>
                  <Button onClick={handleSave}>Сохранить</Button>
                  <Button variant="danger" onClick={() => setEditingUser(null)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {passwordModalOpen && (
          <div className={styles.modal} onClick={() => setPasswordModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Сменить пароль</h2>

              <div className={styles.form}>
                <Input
                  label="Старый пароль"
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  placeholder="••••••••"
                />

                <Input
                  label="Новый пароль"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                />

                <div className={styles.modalActions}>
                  <Button
                    onClick={async () => {
                      if (!passwordForm.oldPassword || !passwordForm.newPassword) {
                        alert('Заполните оба поля');
                        return;
                      }
                      try {
                        const token = auth.getToken();
                        const res = await fetch('/api/users/change-password', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(passwordForm),
                        });
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({} as any));
                          throw new Error(err?.message || 'Не удалось сменить пароль');
                        }
                        alert('Пароль изменён');
                        setPasswordForm({ oldPassword: '', newPassword: '' });
                        setPasswordModalOpen(false);
                      } catch (e: any) {
                        alert(e?.message || 'Ошибка смены пароля');
                      }
                    }}
                  >
                    Сохранить
                  </Button>
                  <Button variant="danger" onClick={() => setPasswordModalOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}







