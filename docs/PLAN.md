# План реализации: мини-CRM «Объекты и задачи»

Задание для AI-разработчика. Бюджет — **2–3 часа всего**, дизайн не оценивается. Оцениваются: логика, защита данных на уровне базы, понимание сделанного.

**Стек:** React + TypeScript + Vite + Blueprint.js + Redux (берём за основу админку Олега, ссылка у тебя есть) + Supabase (облако, free tier). Бэкенда нет: фронт ходит в Supabase напрямую через `supabase-js` с публичным ключом. Все права проверяет Postgres (RLS + функции).

---

## 0. Что уже готово — НЕ ПЕРЕПИСЫВАТЬ

| Файл | Что внутри |
|---|---|
| `supabase/migrations/20261104000000_init.sql` | Схема, RLS, триггеры, RPC `change_task_status`. Проверено на Postgres 16 |
| `supabase/seed.sql` | 3 объекта, 6 задач во всех статусах, реальная история (через ту же RPC) |
| `supabase/tests/*.sql` | 32 атаки «в обход интерфейса» (все блокируются) + happy path. Запуск на чистом Postgres: сначала shim, потом миграция, создать 3 юзера в `auth.users`, seed, потом attacks |

**Модель данных (коротко):**

- `profiles(id = auth.users.id, full_name, role: 'manager' | 'executor')` — создаётся триггером при создании юзера, роль по умолчанию `executor`.
- `objects(id, name, address, created_at)`
- `tasks(id, title, description, object_id, assignee_id, status, author_id, created_at, updated_at)`
- `task_status_history(id, task_id, from_status, to_status, changed_by, comment, created_at)`
- Статусы (enum): `new`, `in_progress`, `review`, `accepted`, `rework`.

**Контракт для фронта (важно):**

- Insert/update задачи — **только** колонки `title, description, object_id, assignee_id`. Если передать `status`, `author_id` или `created_at`, Postgres вернёт `permission denied` (column-level grants). Автор и статус проставляет база сама.
- Смена статуса — **только** `supabase.rpc('change_task_status', { p_task_id, p_to, p_comment })`. Для `rework` комментарий обязателен (база проверит).
- В историю фронт ничего не пишет, только читает.
- Исполнитель физически получает из базы только свои задачи и объекты с его задачами, фильтровать на фронте не нужно (но `eq('assignee_id', uid)` в «Моих задачах» не мешает).

---

## 1. Supabase (≈15 мин) — делает Олег руками или разработчик с его доступом

1. Создать проект на supabase.com (free).
2. **Authentication → Sign In / Providers → выключить «Allow new users to sign up».** Это пункт 5 требований безопасности.
3. Применить миграцию:
   - вариант A (быстро): SQL Editor → вставить `supabase/migrations/20261104000000_init.sql` → Run;
   - вариант B: `npx supabase link --project-ref <ref>` → `npx supabase db push`.
4. Authentication → Users → **Add user** (галка *Auto Confirm User*), пароли придумать:
   - `manager@example.com`
   - `ivanov@example.com`
   - `petrov@example.com`
5. SQL Editor → выполнить `supabase/seed.sql` (назначит роли и имена, создаст данные).
6. Project Settings → API: взять **Project URL** и **anon / publishable key**. `service_role` / secret key **не трогать и никуда не копировать**.
7. Типы: `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`.

---

## 2. Фронтенд (≈1.5 ч)

### 2.1. Каркас из админки Олега

- Скопировать репо админки в новый репозиторий. Оставить: Vite, TS, Blueprint, роутинг, Redux store, layout (sidebar/navbar), Toaster, компоненты форм/диалогов/таблиц.
- Удалить доменные модули, старый REST API-клиент и его auth (токены, refresh и т.п.).
- `.env.example`:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  ```
  `.env` — в `.gitignore`.

### 2.2. Слой данных (замена REST-клиента)

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

`src/api/*.ts` — чистые async-функции, каждая делает `const { data, error } = await …; if (error) throw error; return data;`. Подключить их к Redux так, как сейчас устроена админка:
- если RTK Query → `createApi({ baseQuery: fakeBaseQuery(), endpoints: … queryFn: async () => { try { return { data: await fn() } } catch (e) { return { error: e } } } })`, теги `Task`, `Object`, `History` для инвалидации;
- если thunks → `createAsyncThunk` поверх этих функций.

Запросы (копировать как есть):

```ts
// objects list (count учитывает RLS: исполнитель видит число только своих задач)
supabase.from('objects').select('id, name, address, tasks(count)').order('name');

// object card
supabase.from('objects').select('id, name, address').eq('id', id).single();
supabase.from('tasks')
  .select('id, title, status, created_at, assignee:profiles!tasks_assignee_id_fkey(id, full_name)')
  .eq('object_id', id).order('created_at');

// task card
supabase.from('tasks')
  .select(`id, title, description, status, created_at, object_id, assignee_id,
           object:objects(id, name, address),
           assignee:profiles!tasks_assignee_id_fkey(id, full_name),
           author:profiles!tasks_author_id_fkey(id, full_name)`)
  .eq('id', id).single();
supabase.from('task_status_history')
  .select('id, from_status, to_status, comment, created_at, actor:profiles(full_name)')
  .eq('task_id', id).order('id');

// my tasks (executor)
supabase.from('tasks')
  .select('id, title, status, created_at, object:objects(id, name)')
  .eq('assignee_id', userId).order('created_at', { ascending: false });

// executors for the assignee picker
supabase.from('profiles').select('id, full_name').eq('role', 'executor').order('full_name');

// manager CRUD
supabase.from('objects').insert({ name, address }).select().single();
supabase.from('objects').update({ name, address }).eq('id', id);
supabase.from('objects').delete().eq('id', id);          // каскадно удалит задачи
supabase.from('tasks').insert({ title, description, object_id, assignee_id }).select().single();
supabase.from('tasks').update({ title, description, object_id, assignee_id }).eq('id', id);
supabase.from('tasks').delete().eq('id', id);

// status
supabase.rpc('change_task_status', { p_task_id: id, p_to: 'review', p_comment: comment ?? null });
```

### 2.3. Авторизация

- Экран `/login`: email + пароль → `supabase.auth.signInWithPassword`. Ссылки «Регистрация» нет.
- В корне приложения: `supabase.auth.getSession()` + `onAuthStateChange` → в store кладём `session` и `profile` (`from('profiles').select('id, full_name, role').eq('id', session.user.id).single()`).
- Protected routes: без сессии → `/login`. В navbar: имя, роль, «Выйти» (`supabase.auth.signOut()`).
- Роль на фронте нужна только для того, чтобы показывать или скрывать кнопки и меню. Права всё равно проверяет база.

### 2.4. Экраны и роуты

| Роут | Кто | Содержимое |
|---|---|---|
| `/login` | все | форма входа |
| `/objects` | оба | таблица объектов (название, адрес, кол-во задач). Manager: «Создать», edit/delete (Dialog + Alert-подтверждение) |
| `/objects/:id` | оба | данные объекта + таблица задач (название, исполнитель, статус Tag). Manager: «Новая задача» (объект предзаполнен) |
| `/tasks/:id` | оба | поля задачи, кнопки доступных действий, история (таймлайн: дата, кто, «из → в», комментарий). Manager: edit/delete |
| `/my-tasks` | executor | его задачи, группировка или фильтр по статусу, объект в строке |

Редирект после логина: manager → `/objects`, executor → `/my-tasks`. Пустой или чужой `id` (запрос вернул ошибку или null) → «Не найдено».

Форма задачи: title (required), description (textarea), object (select), assignee (select executors).

### 2.5. Кнопки статусов — одна чистая функция

`src/domain/taskActions.ts` — зеркало правил базы (для UI, не для безопасности):

```ts
type Action = { to: TaskStatus; label: string; needsComment?: boolean; intent?: Intent };
export function availableActions(task, me): Action[] {
  const isAssignee = task.assignee_id === me.id;
  const isManager = me.role === 'manager';
  switch (task.status) {
    case 'new':         return isAssignee ? [{ to: 'in_progress', label: 'Взять в работу' }] : [];
    case 'in_progress': return isAssignee ? [{ to: 'review', label: 'Отправить на проверку' }] : [];
    case 'rework':      return isAssignee ? [{ to: 'in_progress', label: 'Взять в работу' }] : [];
    case 'review':      return isManager ? [
                          { to: 'accepted', label: 'Принять', intent: 'success' },
                          { to: 'rework', label: 'Вернуть на доработку', needsComment: true, intent: 'warning' },
                        ] : [];
    default:            return [];
  }
}
```

- «Вернуть на доработку» → Dialog с TextArea, кнопка disabled, пока комментарий пустой.
- Остальные действия: опциональный комментарий не нужен, просто вызвать RPC.
- После RPC: инвалидировать задачу, историю и списки. Ошибку RPC показать в Toaster (`error.message`).

Справочник статусов (`src/domain/status.ts`): `new` — «Новая» (none), `in_progress` — «В работе» (primary), `review` — «На проверке» (warning), `rework` — «На доработке» (danger), `accepted` — «Принята» (success).

---

## 3. Скрипт «попробуйте взломать» (≈15 мин, сильно помогает на созвоне)

`scripts/security-check.ts` (запуск: `npx tsx scripts/security-check.ts`). Использует **тот же публичный ключ**, логинится как `ivanov@example.com` (пароль из env `EXECUTOR_PASSWORD`) и печатает PASS/FAIL по каждому пункту:

1. `select` из `tasks` → только его задачи (нет ни одной с чужим `assignee_id`).
2. `select` чужой задачи по id → пусто.
3. `update tasks set title` по своей и чужой задаче → 0 строк (`.select()` вернёт `[]`).
4. `update tasks set status='accepted'` → ошибка.
5. `insert` в `tasks`, `objects` → ошибка.
6. `insert`, `update`, `delete` в `task_status_history` → ошибка.
7. `update profiles set role='manager'` → ошибка.
8. `rpc change_task_status` для своей задачи `review → accepted` → ошибка.
9. `rpc` для чужой задачи → ошибка.

ID для проверок брать запросом под менеджером (`MANAGER_PASSWORD` в env) в начале скрипта. Пароли только в env, не в коде.

---

## 4. Деплой (≈10 мин)

- GitHub: новый репозиторий. Проверить, что `.env` не закоммичен и `service_role` нигде нет (`git grep -i service_role` → только упоминание в README).
- Vercel: Import repo → Framework Vite → env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → Deploy.
- `vercel.json` для SPA-роутинга:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- Supabase → Authentication → URL Configuration → Site URL = адрес Vercel.
- Прокликать: менеджер (CRUD, принять, вернуть с комментарием), Иван (взять, отправить), Пётр (не видит задач Ивана).

---

## 5. README.md (коротко)

1. Что это и ссылка на демо + тестовые доступы (3 юзера).
2. Запуск локально: `npm i`, `.env` из `.env.example`, `npm run dev`.
3. Развернуть свою базу: шаги из раздела 1.
4. Где лежит безопасность: миграция, ключевые механизмы (RLS, column grants, RPC, триггеры), как запустить `security-check`.

---

## 6. Чего НЕ делать

- Никакого `service_role` / secret key во фронте, в `.env.example`, в репо.
- Никакой страницы регистрации и `signUp`.
- Не писать статус, автора или историю с фронта в обход RPC.
- Не менять миграцию без крайней нужды. Если меняешь, перепрогони `supabase/tests`.
- Не тратить время на дизайн, i18n, unit-тесты UI, пагинацию, realtime.

---

## Приложение A. Решения и допущения (черновик для сдачи, пункт 4)

1. Роли хранятся в `profiles`. Новый пользователь — всегда исполнитель, повышение только вручную в базе. Через API роль не меняется.
2. Постановщик может редактировать и переназначать задачу в любом статусе и удалять её; вместе с задачей удаляется её история. Удаление объекта удаляет его задачи.
3. Исполнителем можно назначить только пользователя с ролью «исполнитель».
4. Постановщик не может сам двигать задачу за исполнителя: «Взять в работу» и «Отправить на проверку» доступны только назначенному исполнителю (строго по таблице переходов). «Принята» — конечный статус.
5. Комментарий обязателен только при возврате на доработку (пустой или из одних пробелов не принимается). При других переходах комментарий не запрашивается.
6. Все пользователи видят имена других пользователей (нужно для истории и выбора исполнителя). Email и пароли не показываются.
7. Если задачу переназначили, прежний исполнитель перестаёт её видеть вместе с историей.
8. Для исполнителя «нет задачи» и «чужая задача» выглядят одинаково («Не найдено»), чтобы нельзя было угадывать чужие id.
9. Администратор базы (доступ к дашборду Supabase) технически может всё. Защита рассчитана на пользователей приложения и прямые запросы к API.

**Не успели / можно улучшить:** realtime-обновления, пагинация и поиск, аудит изменений полей задачи (не только статуса), soft delete вместо удаления, e2e-тесты.

## Приложение B. Объяснение для руководителя (черновик, пункт 3)

> Система хранит объекты (стройки) и задачи по ним. Каждый сотрудник входит под своим логином и паролем. Зарегистрироваться самому нельзя: учётные записи заводит администратор.
>
> Есть две роли. Постановщик создаёт объекты и задачи, назначает исполнителя и принимает работу или возвращает её на доработку с обязательным комментарием. Исполнитель видит только свои задачи и стройки, где они есть. Он может взять задачу в работу и отправить на проверку, больше ничего.
>
> Главное: правила проверяет сама база данных, а не экран. Даже если исполнитель разбирается в программировании и отправит запрос напрямую, минуя интерфейс, база не отдаст ему чужие задачи. Она не позволит принять свою же работу, перескочить через этап или удалить задачу.
>
> Каждая смена статуса автоматически записывается в историю: кто, когда, из какого статуса в какой и с каким комментарием. Эту историю никто не может изменить или стереть через приложение, даже постановщик. Секретные ключи доступа к базе в приложение и в код не попадают.

---

## Тайминг

| Шаг | Время |
|---|---|
| Supabase + миграция + юзеры + seed | 15 мин |
| Каркас из админки + supabase client + auth | 30 мин |
| Экраны + действия статусов | 60 мин |
| security-check скрипт | 15 мин |
| Деплой + прокликать | 15 мин |
| README + доработка приложений A/B | 15 мин |
