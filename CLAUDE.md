# PULSO - Sistema de Gestión de Horas y Tareas

Sistema para oficina de creación multimedia universitaria. 8-12 becarios + 1 jefe. Registro de horas (RFID), tareas con Kanban, eventos, equipos, bitácoras, chat, reportes Excel.

---

## Stack

**Frontend:** React 18, TS 5, Vite, Tailwind 3, TanStack Query 5, React Hook Form + Zod, React Router 6, Axios, Lucide
**Backend:** Node 20, Express 4, TS, Prisma 5, PostgreSQL 15+, JWT + bcrypt, Zod, Swagger
**RFID:** Microservicio ESP32 → API con `RFID_API_KEY`

---

## Estructura del Proyecto

```
pulso-app/
├── frontend/src/
│   ├── components/   # ui/, shared/, tasks/, events/, calendar/, time-entries/, weekly-log/, users/, equipment/, reports/
│   ├── pages/        # Login, Dashboard, Tasks, Events, Calendar, TimeEntries, WeeklyLog, Users, Equipment, EquipmentLoans, RfidManagement, EventRequests, Reports
│   │   └── public/   # SolicitorPortal, EventRequestForm, MyEventRequests
│   ├── hooks/, services/, stores/, types/, utils/, lib/, styles/
├── backend/src/
│   ├── controllers/, routes/, middlewares/, services/, schemas/, utils/, types/, config/
│   └── prisma/       # schema.prisma, migrations/
└── backend/uploads/  # profiles/, attachments/
```

---

## Roles y Permisos

| Acción | Admin | Supervisor | Becario |
|--------|-------|------------|---------|
| CRUD usuarios | ✅ | 👁️ ver | ❌ |
| Gestionar horas (todos) | ✅ | ✅ | Solo propias (clock in/out) |
| CRUD tareas | ✅ | ✅ | Ver solo asignadas, cambiar estado (no a Completado) |
| CRUD eventos | ✅ | ✅ crear/editar | ❌ |
| Eliminar eventos | ✅ | ❌ | ❌ |
| Bitácoras | Ver todas | Ver equipo | Solo propia |
| Reportes | ✅ | ✅ | ❌ |
| Aprobar tareas en revisión | ✅ | ✅ | ❌ |

---

## Schema Prisma (resumen de relaciones)

> Ver `backend/prisma/schema.prisma` para el schema completo.

**Enums:** `UserRole` (admin/supervisor/becario), `TaskStatus` (pending/in_progress/review/completed), `TaskPriority` (high/medium/low), `EquipmentCategory` (camera/lens/adapter/sd_card), `EquipmentStatus` (available/in_use/maintenance), `EventType` (civic/church/yearbook/congress)

**Modelos y relaciones clave:**
- `User` → TimeEntry[], Task[] (creator), TaskAssignee[], Event[] (creator), EventAssignee[], EventShift[], Comment[], WeeklyLog[], EquipmentAssignment[] (user + creator), EquipmentUsageLog[]
- `Task` → creator (User), TaskAssignee[], Comment[]
- `Event` → creator (User), EventAssignee[], TimeEntry[], EquipmentAssignment[], EventDay[] → EventShift[] → EquipmentAssignment[]
- `Equipment` → EquipmentAssignment[], EquipmentUsageLogItem[]
- `EquipmentUsageLog` → user (User), EquipmentUsageLogItem[] → Equipment
- `PendingRfid` — tags RFID sin asignar
- `WeeklyLog` — unique por [userId, weekStart]
- `Notification` — task_assigned, task_review, task_comment, event_assigned
- `Conversation` → ConversationParticipant[], Message[]
- `EventRequest` — solicitudes públicas con código de acceso y token de 6 dígitos

> ⚠️ **Prisma Decimals:** `totalHours` se devuelve como string. Siempre usar `Number()` antes de operar.

---

## API Endpoints

### Auth
```
POST   /api/auth/login|logout|refresh
GET    /api/auth/me
```

### Users
```
GET    /api/users          GET|POST|PUT|DELETE /api/users/:id
GET    /api/users/me
POST|DELETE /api/users/:id/profile-image
POST|DELETE /api/users/:id/rfid
```

### Time Entries
```
GET    /api/time-entries                 # filtros: userId, dateFrom, dateTo
GET    /api/time-entries/:id|active|summary
POST   /api/time-entries/clock-in|clock-out|rfid
POST|PUT|DELETE /api/time-entries/:id    # admin/supervisor: CRUD manual
```

### Tasks
```
GET    /api/tasks           # becarios solo ven asignadas
GET    /api/tasks/:id
POST   /api/tasks           PUT /api/tasks/:id    DELETE /api/tasks/:id
PATCH  /api/tasks/:id/status
POST   /api/tasks/:id/comments
```

### Events
```
GET    /api/events                    # filtros: date_from, date_to
GET    /api/events/upcoming|:id
POST|PUT|DELETE /api/events/:id
POST   /api/events/:id/equipment/:userId/release|transfer
GET|POST /api/events/:id/checklist
PATCH|DELETE /api/events/:id/checklist/:itemId
POST   /api/events/:id/comments
```

### Weekly Logs
```
GET    /api/weekly-logs               # filtros: user_id, week
GET    /api/weekly-logs/:id|current-week
GET    /api/weekly-logs/summary/:userId
POST|PUT /api/weekly-logs/:id
```

### Equipment
```
GET|POST /api/equipment               # filtros: category, status, active
GET|PUT|DELETE /api/equipment/:id
POST|DELETE /api/equipment/:id/rfid
```

### Equipment Assignments
```
GET|POST /api/equipment-assignments
PUT|DELETE /api/equipment-assignments/:id
POST   /api/equipment-assignments/:id/return
```

### Equipment Loans (RFID)
```
POST   /api/equipment-loans/scan                          # ESP32, auth con API key
GET    /api/equipment-loans/history|session
GET    /api/equipment-loans/equipment/:equipmentId/history
```

### RFID Pendientes
```
GET    /api/rfid/pending       DELETE /api/rfid/pending/:id
```

### Event Requests (Público)
```
GET    /api/event-requests/public/validate/:code|status/:code
POST   /api/event-requests/public/submit/:code
GET    /api/event-requests/public/my-requests/:token
POST   /api/event-requests/public/recover-access
PUT    /api/event-requests/public/update/:id
```

### Event Requests (Admin)
```
GET    /api/event-requests|pending|stats|config|recovery
GET|PUT /api/event-requests/config
GET    /api/event-requests/:id
POST   /api/event-requests/:id/approve|reject|request-changes
POST   /api/event-requests/recovery/:id/sent
DELETE /api/event-requests/recovery/:id
```

### Reports
```
GET    /api/reports/hours-by-user|hours-by-event|tasks-summary|productivity|weekly-logs
GET    /api/reports/export/:type     # Excel
```

---

## Notas de Implementación

### Horas por Rol
- **Becario:** Selector de mes, 5 tarjetas resumen (Hoy/Semana/Mes/Sesiones/En curso), clock in/out solo en mes actual
- **Admin/Supervisor (TeamHoursOverview):** Resumen equipo, barras de progreso, cards por becario, modal detalle con gráfico semanal + CRUD de horas
- **AddTimeEntryModal:** Modo rápido (botones 1-8h) y modo manual (hora entrada/salida), selector de evento opcional

### Filtrado de Tareas
Becarios solo ven tareas asignadas: `where.assignees = { some: { userId } }` en `task.service.ts`

### Kanban
Tareas: drag & drop con `@dnd-kit`. Becarios no pueden mover a Completado directamente.
Eventos: tablero por estado temporal (Próximos/En Curso/Finalizados), sin drag & drop.

### Sistema RFID
1. ESP32 envía tag → `/api/equipment-loans/scan` (auth con `RFID_API_KEY`)
2. Tag usuario → inicia sesión de escaneo (3 min timeout)
3. Tag equipo → registra en sesión activa
4. Tag desconocido → `PendingRfid`
5. Al cerrar sesión → crea `EquipmentUsageLog`

### Notificaciones
Tipos: task_assigned, task_review, task_comment, event_assigned. Polling cada 30s. Deep linking con `?open=ID` en Tasks/Events.

### Chat
Conversaciones individuales/grupales con adjuntos. Modelos: Conversation, ConversationParticipant, Message.

### Adjuntos
Multer → `backend/uploads/attachments/`. Preview: imágenes, PDFs, videos, texto. Descarga autenticada con blob URLs.

### Exportar Tarea PNG
`html-to-image`, vista 600px con estilos inline, resolución 2x.

### Exportar Eventos PDF
`jspdf`. Selección múltiple, filtro fin de semana. Incluye: info general, requisitos, días/turnos, avatares base64, checklist, comentarios.
- jsPDF no soporta unicode → usar ASCII
- Horarios weekend predeterminados: Viernes 19-20h, Sábado 8-13h

### Portal Público de Solicitudes
Código de acceso → formulario → token 6 dígitos para seguimiento. Admin: aprobar/rechazar/solicitar cambios. Recuperación manual de tokens.

### Selectores de Equipo en Eventos
`ShiftEquipmentSelector` consulta TODOS los equipos activos. El equipo actualmente seleccionado siempre aparece y nunca está deshabilitado.

### Auth Store
Refresca datos del usuario (`authService.getMe()`) al cargar la app para sincronizar profileImage.

### Seguridad
Helmet, rate limiting (general + login + formulario público), CORS restrictivo en producción, trust proxy para Cloudflare.

---

## Reglas Críticas

> ⚠️ **Prisma Decimals** → siempre `Number(value)` antes de sumar/mostrar. Sin esto, concatena strings.

> ⚠️ **Fechas DATE** → parsear con `T12:00:00` para evitar offset timezone. Comparar con `getLocalDateStr()`, NO con `toISOString()`.

> ⚠️ **profileImage** → verificar que `/api/auth/me` la incluya y que auth store refresque al cargar.

---

## Colores

```
Primary: #CC0000 (rojo)   Secondary: #000000   Background: #FFFFFF
Gray: 100/#F5F5F5  300/#D4D4D4  500/#737373  700/#404040
Estados: success/#22C55E  warning/#F59E0B  error/#EF4444  info/#3B82F6
Prioridades: high/#EF4444  medium/#F59E0B  low/#22C55E
Task status: pending/#9CA3AF  in_progress/#3B82F6  review/#F59E0B  completed/#22C55E
```

---

## Comandos

```bash
# Frontend
cd frontend && npm run dev|build|preview|lint
npx tsc --noEmit                    # type-check

# Backend
cd backend && npm run dev|build|start
npx prisma generate|studio
npx prisma migrate dev --name nombre
npx prisma migrate deploy
```

---

**Última actualización:** 12 Marzo 2026 | **Versión:** 4.0
