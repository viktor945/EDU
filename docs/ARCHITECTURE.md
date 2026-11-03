# Архитектура и навигация по коду

Состояние источника: версия 38, `b5bcf720a9eeba8a8e757057611331c329ec00da`.

## Стек

React 19.2.6, TypeScript 5.9.3, Vinext 0.0.50, Vite 8.0.13, Cloudflare Vite plugin, Worker runtime. В package также присутствует Next 16.2.6 и используются совместимые `next/*` API. Это не подтверждение возможности без изменений запустить обычный `next start`.

Рабочие данные — D1 binding `DB`, файлы — R2 binding `BUCKET`. Схема: `db/schema.ts`, миграции `drizzle/0000...0006`. Не выполнять миграции на production без проверки исходного состояния и резервной копии.

`worker/index.ts` устанавливает runtime bindings. `build/cloudflare-workers-shim.ts` предоставляет `env` прикладному коду. `vite.config.ts` настраивает локальные bindings и плагины. `.openai/hosting.json` содержит идентификатор именно существующего сайта; это не файл паролей.

## Основные маршруты

| Маршрут | Назначение |
| --- | --- |
| `/` | Главная публичного портала; выбор организации через `schoolId` |
| `/section/[slug]` | Публичный раздел |
| `/admin` | Административный кабинет с авторизацией |
| `/screen/[id]` | Экран с назначенным профилем показа |
| `/student` | QR-сценарий выбора посетителя и дашборд ученика |
| `/api/platform` | Чтение и CRUD учреждений, сотрудников и материалов |
| `/api/public` | Опубликованный контент конкретного учреждения |
| `/api/content-status` | Массовое изменение статуса материалов |
| `/api/import` | Импорт карточек из Excel |
| `/api/files`, `/api/files/[id]`, `/api/files/recover` | Загрузка, чтение/удаление и восстановление связей файлов |
| `/api/displays`, `/api/screen` | Профили/устройства и публичные данные экрана |
| `/api/calendar-sync` | Согласование событий календаря |
| `/api/translate` | Конфигурация/расход и выполнение перевода |

Сервер проверяет роль, разрешения и принадлежность учреждению. Публичные данные фильтруются по статусу, видимости, срокам, настройкам разделов и приватности контактов родителей. Нельзя заменять это фильтрами только в браузере.

## Где менять поведение

| Файлы | Ответственность |
| --- | --- |
| `app/institutions.ts`, `institution-context.tsx` | Типы организаций, термины, допустимые разделы, поля |
| `app/portal-navigation.ts` | Общий порядок и доступность меню |
| `app/content-model.ts`, `safety-fields.ts` | Поля и проверка карточек |
| `app/admin/admin-console.tsx` | Основной кабинет и формы |
| `app/admin/homepage-builder.tsx`, `section-layout-editor.tsx` | Визуальные редакторы блоков |
| `app/school-design.ts`, `home-overview.tsx`, `public-content.tsx` | Темы, layouts и отображение записей |
| `app/record-details.tsx`, `document-preview.tsx` | Подробности, галереи, просмотр документов |
| `app/teacher-resume.tsx`, `person-data.ts`, `person-facts.tsx` | Карточки людей и приватность |
| `app/calendar-model.ts`, `calendar-sync.ts`, `events-center.tsx`, `month-calendar.tsx` | Календарь и события |
| `app/content-organization.ts`, `content-seed.ts` | Идемпотентные миграции старой структуры/демоматериалов |
| `app/language-context.tsx`, `i18n.ts` | Выбор языка и версии публичного контента |
| `app/admin/admin-catalog.ts`, `admin-text.ts`, `admin-locale.tsx` | Словарь и отображение интерфейса админки |
| `app/admin/editing-language.ts`, `language-versions.tsx`, `auto-translate.ts` | Ввод в выбранном языке, ручные версии, автоперевод |
| `app/google-translation.ts`, `translation-validation.ts` | Серверный перевод, лимит/кеш, проверка версий |
| `app/admin/structured-content.tsx`, `public/templates/` | Формы, Excel-импорт и готовые шаблоны |
| `app/experience-model.ts`, `experience-validation.ts` | Настройки главной, ожидания и времени |
| `app/admin/experience-settings.tsx` | Баннеры, заставка и бегущая строка |
| `app/home-stage.tsx`, `banner-model.ts`, `home-announcements.tsx` | Баннеры и важные сообщения |
| `app/clock-time.tsx`, `lesson-clock-model.ts`, `lesson-clock.tsx` | Общие часы, расписание и формат обратного отсчёта |
| `app/portal-experience.tsx`, `standby-player.tsx`, `ticker-motion.ts` | Бездействие, слайд-шоу и анимация строки |
| `app/offline-cache.ts`, `offline-status.tsx`, `public/portal-sw.js` | Офлайн-копии, синхронизация и выдача ресурсов |
| `app/portal-link-guard.tsx` | Ограничение внешних переходов на публичном экране |
| `app/admin/device-manager.tsx`, `display-model.ts` | Состав контента устройств |

## Настройки и данные

В базе есть `schools`, `members`, `files`, `content_items`, `display_profiles`, `display_devices`, `app_operations`, `translation_cache`, `translation_usage`. Структурированные поля записи хранятся в JSON payload; оформление и experience — в настройках учреждения. Сохраняйте формат и идентификаторы при переносе.

Языковые версии используют `_sourceLanguage`, `_translations` и `sourceStamp`. Статусы перевода и подтверждение языкового изображения важны для публикации. UI-локализация `<option>` сохраняет канонический value; переводить его вслед за отображаемым текстом нельзя.

## Сборка, шаблоны и офлайн

`npm run build` вызывает `scripts/build-verified.sh`, затем Vinext build, генерацию `dist/client/offline-assets.json` и проверку Worker-артефакта. Результат: `dist/client` и `dist/server`. `npm run start` относится к этому стеку; Node/VPS-перенос отдельно описан в `SERVER_TRANSFER.md`.

Для шаблонов есть `scripts/export-template-schema.cjs`, `export-localized-template-schema.cjs`, `build-institution-templates.mjs`, `build-localized-templates.mjs`. Готовые XLSX уже включены: 204 языковых шаблона в папках RU/KZ/EN плюс старые пути для совместимости. Генераторы использовали отдельный инструмент авторинга таблиц; его нет среди production npm-зависимостей. Для обычного запуска не нужно заново генерировать шаблоны.

Офлайн использует Cache Storage и Service Worker. Копия данных фиксируется после загрузки связанных файлов и HTML. Синхронизация — 240 000 мс; BroadcastChannel даёт ускоренное обновление между вкладками того же браузера, а не межустройственный push. На другой панели ждать периодической проверки/восстановления сети.

Идентификаторы кеша текущей версии: `stepline-static-v38`, публичные data/files/pages caches версии 1. При смене клиентского кода необходимо согласовать cache revision и page version, иначе установленные устройства могут оставить старую оболочку.

## Границы внешних сервисов

Автоперевод требует `GOOGLE_TRANSLATE_API_KEY` на сервере и включённого Cloud Translation API. Ключ отсутствует в архиве и не должен попадать в клиентский bundle. Состояние подключённого ключа не проверялось при упаковке.

Вход сейчас основан на identity headers Sites. Почтовый/SMS провайдер, платёжный сервис, MDM, heartbeat-агент и приложения Android/Windows не входят в текущие настроенные интеграции. Не добавляйте их фиктивные ключи в `.env` и не выдавайте наличие UI-раздела за действующий сервис.
