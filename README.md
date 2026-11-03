# STEPLine EDU

Облачный информационный портал и Digital Signage для детских садов, школ, колледжей и университетов.

Инструкция для программиста: [SERVER_TRANSFER.md](SERVER_TRANSFER.md).

Исходники: https://github.com/viktor945/EDU . GitHub хранит код и запускает проверки; серверная часть приложения требует Cloudflare Worker, D1 и R2. GitHub Pages для этого приложения не подходит.

Для разработки нужны Linux/WSL, Node.js >=22.13 (проверено на Node 24) и npm:

```bash
git clone https://github.com/viktor945/EDU.git STEPLine-EDU
cd STEPLine-EDU
npm ci
bash scripts/setup-local.sh
npm run dev -- --host 127.0.0.1
```

`setup-local.sh` применяет миграции только к локальной D1 и добавляет синтетические учреждения `local-kindergarten`, `local-school`, `local-college`, `local-university`, по одной новости и тестовое изображение в локальное R2. Повторный запуск сохраняет существующие записи. Рабочая база не подключается. Откройте портал с параметром `?schoolId=local-school` (либо ID другого тестового учреждения). Данные сохраняются в игнорируемом `.wrangler/state`.

Безопасные примеры находятся в `examples/local-development.sql`. Личные записи из архива, локальные базы, секреты, `node_modules` и сборки в Git не включаются. Состав и ограничения выгрузки описаны в [docs/EXPORT_STATUS.md](docs/EXPORT_STATUS.md).

Вход в админку пока предоставляется Sites: локальное перенаправление на `/signin-with-chatgpt` не создаёт сессию. Для независимого размещения сначала нужен серверный механизм авторизации и отдельные D1/R2; см. [SERVER_TRANSFER.md](SERVER_TRANSFER.md). Идентификатор существующего Sites-проекта сохранён для продолжения того же сайта.

Проверки из корня проекта:

```bash
npx tsc --noEmit
node tests/experience.cjs
node tests/content-integration.cjs
node tests/offline-and-languages.cjs
node tests/ticker-motion.cjs
SITES_ENV_READY=1 SITES_PROJECT_ROOT="$PWD" npm run build
node tests/rendered-html.test.mjs
```

Тест content-integration намеренно выводит `Injected write failure` при проверке отката транзакции. Последняя команда запускает два именованных теста HTML; проверяйте, что выполнены оба. GitHub Actions запускает эти проверки при push и pull request.

Развёртывание на Cloudflare из GitHub подготовлено отдельным workflow и включается после подключения вашего аккаунта, D1 и Cloudflare Access. По умолчанию файлы хранятся в D1 без R2: до 2 МБ на файл, база Free до 500 МБ. Настройка и ограничения: [docs/CLOUDFLARE_DEPLOYMENT.md](docs/CLOUDFLARE_DEPLOYMENT.md).
