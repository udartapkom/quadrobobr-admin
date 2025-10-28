import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './MessagesPage.module.scss';

interface Message {
  id: number;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: string;
  isRead: boolean;
  isArchived: boolean;
  telegramSent: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [showArchived]);

  const loadMessages = async () => {
    try {
      const token = auth.getToken();
      const url = showArchived ? '/api/contact-forms/archived' : '/api/contact-forms';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = auth.getToken();
      await fetch(`/api/contact-forms/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadMessages();
      // Обновляем счетчик в Layout
      window.dispatchEvent(new Event('messagesUpdate'));
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Переместить сообщение в архив?')) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/contact-forms/${id}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadMessages();
      window.dispatchEvent(new Event('messagesUpdate'));
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить сообщение безвозвратно?')) return;

    try {
      const token = auth.getToken();
      await fetch(`/api/contact-forms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadMessages();
      window.dispatchEvent(new Event('messagesUpdate'));
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Сообщения</h1>
          <div className={styles.tabs}>
            <button
              className={!showArchived ? styles.active : ''}
              onClick={() => setShowArchived(false)}
            >
              Активные
            </button>
            <button
              className={showArchived ? styles.active : ''}
              onClick={() => setShowArchived(true)}
            >
              Архив
            </button>
          </div>
        </div>

        <div className={styles.messagesList}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageCard} ${!msg.isRead ? styles.unread : ''}`}
            >
              <div className={styles.messageHeader}>
                <div className={styles.messageInfo}>
                  {!msg.isRead && <span className={styles.unreadBadge}></span>}
                  <h3>{msg.name}</h3>
                  <span className={styles.date}>{formatDate(msg.createdAt)}</span>
                </div>
                <div className={styles.messageMeta}>
                  {msg.telegramSent && (
                    <span className={styles.telegramBadge} title="Отправлено в Telegram">
                      ✓ Telegram
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.messageContacts}>
                <div>
                  <strong>Телефон:</strong> {msg.phone}
                </div>
                {msg.email && (
                  <div>
                    <strong>Email:</strong> {msg.email}
                  </div>
                )}
              </div>

              <div className={styles.messageText}>{msg.message}</div>

              <div className={styles.messageActions}>
                {!msg.isRead && (
                  <Button onClick={() => handleMarkAsRead(msg.id)}>
                    Отметить прочитанным
                  </Button>
                )}
                {!showArchived && (
                  <Button onClick={() => handleArchive(msg.id)}>В архив</Button>
                )}
                <Button variant="danger" onClick={() => handleDelete(msg.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <div className={styles.empty}>
              {showArchived ? 'Архив пуст' : 'Нет новых сообщений'}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

