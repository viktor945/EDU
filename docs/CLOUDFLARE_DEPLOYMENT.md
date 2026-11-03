# Развёртывание из GitHub на Cloudflare

Код хранится в `viktor945/EDU`. GitHub Actions проверяет коммит, собирает Worker и может отправить его в ваш Cloudflare-аккаунт. Публикация по умолчанию выключена до подключения аккаунта, базы и авторизации. По умолчанию используется `FILE_STORAGE=d1`: загрузки сохраняются на сервере в D1, без R2 и Images bindings. Это отдельное размещение: существующий Sites-проект не перезаписывается.

## Что требуется от аккаунта

- Cloudflare Account ID и API token с доступом к Workers Scripts (Edit), D1 (Edit), Workers R2 Storage (Edit, только при FILE_STORAGE=r2) в выбранном аккаунте. Если используется Custom Domain, нужны также права на соответствующую зону/Workers Routes. Сужайте доступ токена выбранным аккаунтом и зоной.
- Отдельная D1, например `stepline-edu`, на тарифе Free. В режиме `FILE_STORAGE=d1` отдельное хранилище R2 и платёжные данные для него не нужны. Оставьте Workers/D1 на Free и не подключайте платные сервисы. Бесплатные квоты ограничены: одна D1 до 500 МБ; квоты запросов и записей также действуют. Файлы занимают место в этой же базе; этот режим рассчитан на небольшой тестовый портал. Максимальный файл — 2 МБ, данные разбиты на части до 256 КБ. После исчерпания квот Free запросы могут завершаться ошибкой; этот режим не обещает неограниченную бесплатную эксплуатацию. [Официальные ограничения D1](https://developers.cloudflare.com/d1/platform/limits/). R2 остаётся дополнительным вариантом при явном `FILE_STORAGE=r2`.
- Cloudflare Zero Trust / Access для входа сотрудников. Рекомендуется собственный домен, подключённый к Cloudflare, с публичным поддоменом платформы. На `workers.dev` сначала проверьте доступность Access в настройках Worker: защита всего адреса закроет также публичный портал. Не объявляйте перенос завершённым без проверки публичного доступа и входа.

Файлы репозитория сами по себе не создают ресурсы и не подтверждают публикацию. Реальные D1/R2, Access-приложение и публичный адрес нужно подключить и проверить в выбранном аккаунте.

## Подготовка данных

1. Для пустого тестового размещения создайте новую D1. Скопируйте UUID базы в переменные ниже. При `FILE_STORAGE=d1` bucket не нужен.
2. Для переноса рабочего портала сначала получите полноценный SQL-backup D1 и все объекты R2 с текущего хостинга. `transfer/database-inspection.partial.json` не подходит для восстановления. Сохраняйте id, school_id, file_id и object_key. Восстанавливайте сначала отдельную копию и сверяйте файлы, переводы и настройки.
3. Новая база требует восьми миграций из `drizzle/`. При первом ручном запуске workflow можно включить `apply_migrations`; это разрешено только для новой пустой базы либо после проверки состояния и backup. Обычный push не запускает миграции автоматически. При восстановлении полного SQL-дампа сначала проверьте уже существующую схему и журнал миграций, чтобы не применить CREATE/ALTER повторно.
4. Для уже созданной базы новая миграция `0007_d1_file_storage.sql` добавляет таблицы двоичных файлов. Существующие объекты R2 автоматически в D1 не копируются: при наличии рабочих загрузок нужен отдельный проверенный перенос.
5. Синтетические данные из `scripts/setup-local.sh` предназначены только для локального запуска и не добавляются в production автоматически.

## Вход вместо Sites

Создайте self-hosted приложение Cloudflare Access для поддомена платформы и путей `/admin` и `/admin/*` в одной Access application. Добавьте Allow policy для владельца и разрешённых сотрудников; можно использовать вход по одноразовому email-коду. Владелец в текущем коде — `productstep.dep@gmail.com`; права остальных берутся из `members` в D1. Кнопка приглашения пока не отправляет серверные письма.

Сохраните team domain вида `your-team.cloudflareaccess.com` и Application Audience (AUD, 64 шестнадцатеричных символа). Публичный портал и публичные API не должны попадать под общую политику входа.

Worker удаляет входящие `oai-authenticated-*` заголовки и формирует идентичность только после проверки JWT Cloudflare Access: RS256, подпись, issuer, audience, exp, iat, sub и email. Для API вне защищённого Access-пути проверяется также cookie `CF_Authorization`. Недействительный токен не даёт прав. Запросы изменения с посторонним Origin блокируются. `/signin-with-chatgpt` ведёт на защищённый `/admin`, а выход — на `/cdn-cgi/access/logout`.

Защиту Access настройте до включения публикации. Иначе вход будет перенаправляться между страницами без получения сессии. Существующие серверные проверки ролей и изоляции учреждений сохраняются.

## Настройка GitHub

Если Worker уже создан через Cloudflare Dashboard → Workers & Pages → Import a repository, используется **Workers Builds**. Можно продолжать с ним; одновременно включать второй канал публикации через GitHub Actions не требуется.

Для существующего Worker `edu` откройте Settings → Build (Builds) и задайте:

| Настройка Workers Builds | Значение |
| --- | --- |
| Git repository / Production branch | `viktor945/EDU` / `main` |
| Root directory | Корень репозитория |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |

В **Build variables and secrets** добавьте `CLOUDFLARE_WORKER_NAME=edu`, UUID реальной базы в `CLOUDFLARE_D1_DATABASE_ID`, `FILE_STORAGE=d1`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`; при наличии — `CLOUDFLARE_CUSTOM_DOMAIN`. Используйте Node 24. Эти переменные нужны во время сборки; одних runtime bindings в настройках Worker недостаточно. Авторизацию публикации предоставляет интеграция Workers Builds — отдельный GitHub secret с токеном для этого варианта не нужен.

Ошибка `Please enable R2 through the Cloudflare Dashboard [code: 10042]` означает, что сборка пытается подключить R2. Для старта без R2 используйте `FILE_STORAGE=d1` и команды выше — сгенерированная конфигурация не содержит R2 binding. Активировать R2 не требуется. При будущем явном выборе `FILE_STORAGE=r2` потребуется включить сервис, создать bucket и задать `CLOUDFLARE_R2_BUCKET`; это отдельное решение пользователя.

Если в ошибке указан `site-creator-r2`, запускалась обычная локальная/Sites-сборка. Нужно исправить команды выше: такая сборка содержит placeholder D1 и не включает обязательную проверку Cloudflare Access. Новый `deploy:cloudflare` откажется публиковать этот артефакт. После подготовки реальных переменных запустите повторную сборку. Создание D1 и её миграции остаются отдельным обязательным шагом. В бесплатном режиме R2 включать не нужно.

Ниже — альтернативный вариант через GitHub Actions. Выберите один канал публикации, чтобы две системы не развёртывали один Worker независимо.

В Settings → Environments создайте `cloudflare-production`. Добавьте **secret** `CLOUDFLARE_API_TOKEN` и следующие **variables**:

| Имя | Значение |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | ID вашего аккаунта |
| `CLOUDFLARE_D1_DATABASE_ID` | UUID новой D1, не локальный placeholder |
| `FILE_STORAGE` | `d1` — бесплатный старт без R2 (значение по умолчанию) |
| `CLOUDFLARE_R2_BUCKET` | Только при `FILE_STORAGE=r2`, имя bucket |
| `ACCESS_TEAM_DOMAIN` | Team hostname без `https://` |
| `ACCESS_AUD` | Audience Access-приложения |
| `CLOUDFLARE_WORKER_NAME` | Необязательно, по умолчанию `stepline-edu` |
| `CLOUDFLARE_CUSTOM_DOMAIN` | Необязательно, поддомен без схемы; при наличии workers.dev отключается |

В Settings → Secrets and variables → Actions → Variables добавьте **repository variable** `CLOUDFLARE_DEPLOY_ENABLED=true` после подготовки D1 и Access. До этого workflow развёртывания пропускается.

Для первой публикации откройте Actions → Deploy STEPLine EDU to Cloudflare → Run workflow → main. Включайте миграции только по правилам выше. После успешной настройки каждый push в main развёртывается после успешного Validate STEPLine EDU. Pull request не получает токен публикации. Старые коммиты не развёртываются поверх нового main.

API-токен добавляйте через интерфейс секретов, не в чат или Git. Для работы агента с аккаунтом токен можно отдельно подключить через секреты облачной среды с назначением `api.cloudflare.com`. Секрет среды Codex автоматически не становится секретом GitHub Actions.

## Сборка без публикации

При заданных несекретных переменных из таблицы:

```bash
npm ci
bash scripts/build-cloudflare.sh
node tests/rendered-html.test.mjs
node tests/cloudflare-worker.test.mjs
```

Результат — `dist/server/wrangler.json`, Worker и `dist/client`; конфигурация не содержит Sites project ID. Не публикуйте обычную локальную сборку с `site-creator-d1` и placeholder UUID. `scripts/build-cloudflare.sh` требует реальные настройки и отклоняет локальный placeholder; CI проверяет сборку с отдельными тестовыми значениями без публикации.

## Проверка после развёртывания

Проверьте публичный портал и файлы без входа; вход владельца и выход; отказ запросу `/api/platform` с поддельной почтой; роли сотрудников; сохранение → публикацию → показ для четырёх типов учреждений; отсутствие смешивания данных; языковые файлы; загрузку всей офлайн-копии до отключения сети. Иллюстрации портала отображаются обычными изображениями без платного Cloudflare Images. В standalone-конфигурации Images binding отсутствует; неиспользуемый endpoint оптимизации возвращает 404.

Не переключайте рабочий домен и не выключайте Sites, пока не проверены рабочие данные, файлы, вход и основные сценарии на новом адресе. Публичный адрес и результат настоящей публикации фиксируются после подключения аккаунта.

Официальные инструкции: [Workers GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/), [проверка JWT](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).
