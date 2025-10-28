import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './FaqPage.module.scss';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export default function FaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [editingItem, setEditingItem] = useState<Partial<FaqItem> | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const token = auth.getToken();
      const response = await fetch('/api/faq/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Ошибка загрузки FAQ:', error);
    }
  };

  const handleCreate = () => {
    setEditingItem({});
    setFormData({
      question: '',
      answer: '',
      order: items.length,
      isActive: true,
    });
  };

  const handleEdit = (item: FaqItem) => {
    setEditingItem(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      order: item.order,
      isActive: item.isActive,
    });
  };

  const handleSave = async () => {
    if (!formData.question || !formData.answer) {
      alert('Заполните вопрос и ответ');
      return;
    }

    try {
      const token = auth.getToken();
      const url = editingItem?.id ? `/api/faq/${editingItem.id}` : '/api/faq';
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
      loadItems();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить вопрос-ответ?')) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/faq/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadItems();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Вопрос-ответ (FAQ)</h1>
          <Button onClick={handleCreate}>Добавить вопрос</Button>
        </div>

        <div className={styles.itemsList}>
          {items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemContent}>
                <div className={styles.question}>
                  <strong>Вопрос:</strong> {item.question}
                </div>
                <div className={styles.answer}>
                  <strong>Ответ:</strong> {item.answer}
                </div>
                <div className={styles.meta}>
                  <span>Порядок: {item.order}</span>
                  <span className={item.isActive ? styles.active : styles.inactive}>
                    {item.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
              <div className={styles.itemActions}>
                <Button onClick={() => handleEdit(item)}>Редактировать</Button>
                <Button variant="danger" onClick={() => handleDelete(item.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className={styles.empty}>Нет вопросов</div>
          )}
        </div>

        {editingItem && (
          <div className={styles.modal} onClick={() => setEditingItem(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingItem.id ? 'Редактировать' : 'Новый вопрос-ответ'}</h2>

              <div className={styles.form}>
                <Input
                  label="Вопрос *"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Как арендовать квадроцикл?"
                />

                <div className={styles.inputGroup}>
                  <label>Ответ *</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Для аренды квадроцикла вам нужно..."
                    rows={6}
                  />
                </div>

                <div className={styles.row}>
                  <Input
                    label="Порядок"
                    type="number"
                    value={formData.order.toString()}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                  />

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
                  <Button onClick={handleSave}>Сохранить</Button>
                  <Button variant="danger" onClick={() => setEditingItem(null)}>
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



