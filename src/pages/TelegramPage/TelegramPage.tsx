import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Button, Input } from '../../ui-kit';
import { auth } from '../../utils/auth';
import styles from './TelegramPage.module.scss';

interface TelegramSettings {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
}

export default function TelegramPage() {
  const [settings, setSettings] = useState<TelegramSettings>({
    botToken: '',
    chatId: '',
    isEnabled: false,
  });
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = auth.getToken();
      const response = await fetch('/api/telegram/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const handleSave = async () => {
    try {
      const token = auth.getToken();
      await fetch('/api/telegram/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения настроек');
    }
  };

  const handleTest = async () => {
    setTestStatus('Отправка...');
    try {
      const token = auth.getToken();
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setTestStatus('✓ Тестовое сообщение отправлено');
      } else {
        setTestStatus('✗ Ошибка отправки');
      }
    } catch (error) {
      setTestStatus('✗ Ошибка подключения');
    }

    setTimeout(() => setTestStatus(''), 5000);
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Настройки Telegram</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <h2>Подключение бота</h2>
            <p className={styles.description}>
              Для получения уведомлений о новых сообщениях в Telegram, настройте бота:
            </p>

            <div className={styles.form}>
              <Input
                label="Токен бота"
                value={settings.botToken}
                onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              />

              <Input
                label="Chat ID"
                value={settings.chatId}
                onChange={(e) => setSettings({ ...settings, chatId: e.target.value })}
                placeholder="-1001234567890"
              />

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                  />
                  {' '}Включить отправку уведомлений
                </label>
              </div>

              <div className={styles.actions}>
                <Button onClick={handleSave}>
                  {saved ? '✓ Сохранено' : 'Сохранить настройки'}
                </Button>
                {settings.botToken && settings.chatId && (
                  <Button onClick={handleTest} variant="primary">
                    Отправить тестовое сообщение
                  </Button>
                )}
              </div>

              {testStatus && (
                <div className={`${styles.testStatus} ${testStatus.includes('✓') ? styles.success : styles.error}`}>
                  {testStatus}
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2>Инструкция</h2>
            <div className={styles.instructions}>
              <h3>1. Создание бота</h3>
              <ul>
                <li>Найдите в Telegram бота <code>@BotFather</code></li>
                <li>Отправьте команду <code>/newbot</code></li>
                <li>Следуйте инструкциям и получите токен бота</li>
              </ul>

              <h3>2. Получение Chat ID</h3>
              <ul>
                <li>Создайте группу или канал в Telegram</li>
                <li>Добавьте туда созданного бота</li>
                <li>Отправьте любое сообщение в группу/канал</li>
                <li>
                  Перейдите по ссылке:{' '}
                  <code>https://api.telegram.org/bot{'<'}ВАШ_ТОКЕН{'>'}/getUpdates</code>
                </li>
                <li>
                  Найдите в ответе поле <code>chat.id</code>
                </li>
              </ul>

              <h3>3. Настройка</h3>
              <ul>
                <li>Вставьте полученный токен в поле "Токен бота"</li>
                <li>Вставьте Chat ID в соответствующее поле</li>
                <li>Включите отправку уведомлений</li>
                <li>Нажмите "Сохранить настройки"</li>
                <li>Проверьте работу, отправив тестовое сообщение</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

