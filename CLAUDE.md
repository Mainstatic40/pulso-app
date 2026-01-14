# PULSO - Sistema de Gestión de Horas y Tareas

## 📋 Descripción del Proyecto

PULSO es un sistema de gestión de horas de trabajo y tareas para una oficina de creación multimedia universitaria. El sistema permite:

- Registro de horas de trabajo mediante lector RFID (credenciales universitarias)
- Gestión de tareas con flujo de estados, prioridades y turnos (mañana/tarde)
- Asignación de equipos a tareas por turno y usuario
- Gestión de eventos especiales con asignación de personal
- Gestión de equipos con asignación por turnos no solapados
- **Sistema RFID completo** para registro de horas y tracking de equipos
- **Historial de uso de equipos** mediante escaneo RFID
- **Portal público de solicitudes de cobertura de eventos**
- Calendario nativo con vistas de mes, semana y dia
- Bitácora semanal para que los becarios documenten su progreso
- Reportes exportables a Excel
- Vista de horas por mes con resumen diario/semanal/mensual
- Gestión administrativa de horas (agregar/editar/eliminar)

**Usuarios:** 8-12 becarios + 1 jefe de departamento

---

## 🛠️ Stack Tecnológico

### Frontend Web
- **Framework:** React 18.x con TypeScript 5.x
- **Build Tool:** Vite
- **Estilos:** Tailwind CSS 3.x
- **Estado del servidor:** TanStack Query (React Query) 5.x
- **Formularios:** React Hook Form + Zod (validación)
- **Routing:** React Router DOM 6.x
- **HTTP Client:** Axios
- **Iconos:** Lucide React

### Frontend Mobile
- **Framework:** React Native 0.72+ con TypeScript
- **Navegación:** React Navigation 6.x
- **Estado:** TanStack Query
- **Estilos:** NativeWind (Tailwind para RN)

### Backend
- **Runtime:** Node.js 20.x LTS
- **Framework:** Express.js 4.x con TypeScript
- **ORM:** Prisma 5.x
- **Base de datos:** PostgreSQL 15+
- **Autenticación:** JWT (jsonwebtoken) + bcrypt
- **Validación:** Zod
- **Documentación API:** Swagger/OpenAPI

### Integraciones
- **Lector RFID:** Microservicio para comunicación con hardware

### Herramientas de Desarrollo
- **Monorepo:** Estructura manual (sin Turborepo por simplicidad)
- **Linting:** ESLint + Prettier
- **Testing:** Vitest (frontend), Jest (backend)
- **Git Hooks:** Husky + lint-staged

---

## 📁 Estructura del Proyecto

```
pulso-app/
├── CLAUDE.md                 # Este archivo
├── README.md                 # Documentación general
├── .gitignore
├── .env.example              # Variables de entorno de ejemplo
│
├── frontend/                 # Aplicación web React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── ui/           # Componentes base (Button, Input, Card, Modal, etc.)
│   │   │   ├── shared/       # Componentes compartidos (Header, Sidebar, Layout, etc.)
│   │   │   ├── tasks/        # Componentes de tareas (TaskCard, TaskForm, TaskModal, etc.)
│   │   │   ├── events/       # Componentes de eventos (EventCard, EventForm, EventModal)
│   │   │   ├── calendar/     # Componentes de calendario (CalendarHeader, MonthView, WeekView, DayView, etc.)
│   │   │   ├── time-entries/ # Componentes de registro de horas (ClockButton, TimeEntryList, etc.)
│   │   │   ├── weekly-log/   # Componentes de bitácora (WeeklyLogCard, WeeklyLogForm, etc.)
│   │   │   ├── users/        # Componentes de usuarios (UserTable, UserForm, UserModal)
│   │   │   ├── equipment/    # Componentes de equipos (EquipmentList, EquipmentForm, AssignmentModal)
│   │   │   └── reports/      # Componentes de reportes (ReportFilters, HoursByUserReport, etc.)
│   │   ├── pages/            # Páginas/Vistas
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── TimeEntries.tsx
│   │   │   ├── WeeklyLog.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Equipment.tsx
│   │   │   ├── EquipmentLoans.tsx  # Historial de uso de equipos
│   │   │   ├── RfidManagement.tsx  # Gestión de credenciales RFID pendientes
│   │   │   ├── EventRequests.tsx   # Gestión de solicitudes de eventos (admin)
│   │   │   ├── Reports.tsx
│   │   │   └── public/             # Páginas públicas (sin auth)
│   │   │       ├── SolicitorPortal.tsx    # Portal de acceso para solicitantes
│   │   │       ├── EventRequestForm.tsx   # Formulario de solicitud
│   │   │       └── MyEventRequests.tsx    # Ver mis solicitudes
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # Llamadas a API (axios)
│   │   ├── stores/           # Estado global (auth.store.tsx)
│   │   ├── types/            # TypeScript interfaces/types
│   │   ├── utils/            # Funciones utilitarias
│   │   ├── lib/              # Configuraciones (axios, react-query)
│   │   └── styles/           # Estilos globales
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                  # API REST Node.js
│   ├── src/
│   │   ├── controllers/      # Controladores de rutas
│   │   ├── routes/           # Definición de rutas
│   │   ├── middlewares/      # Middlewares (auth, validation, upload)
│   │   ├── services/         # Lógica de negocio
│   │   ├── schemas/          # Esquemas de validación Zod
│   │   ├── utils/            # Funciones utilitarias
│   │   ├── types/            # TypeScript interfaces/types
│   │   └── config/           # Configuraciones
│   ├── prisma/
│   │   ├── schema.prisma     # Esquema de base de datos
│   │   └── migrations/       # Migraciones
│   ├── uploads/              # Archivos subidos (no versionado)
│   │   └── profiles/         # Fotos de perfil de usuarios
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                   # Aplicación React Native
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
│
└── shared/                   # Código compartido (tipos, constantes)
    └── types/
        └── index.ts
```

---

## 🗄️ Esquema de Base de Datos (Prisma)

### Esquema Prisma Completo

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ ENUMS ============

enum UserRole {
  admin
  supervisor
  becario
}

enum TaskStatus {
  pending
  in_progress
  review
  completed
}

enum TaskPriority {
  high
  medium
  low
}

enum EquipmentCategory {
  camera
  lens
  adapter
  sd_card
}

enum EquipmentStatus {
  available
  in_use
  maintenance
}

enum EventType {
  civic
  church
  yearbook
  congress
}

// ============ MODELOS ============

model User {
  id           String   @id @default(uuid())
  name         String   @db.VarChar(100)
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  rfidTag      String?  @unique @map("rfid_tag") @db.VarChar(50)
  profileImage String?  @map("profile_image") @db.VarChar(255)
  role         UserRole @default(becario)
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relaciones
  timeEntries          TimeEntry[]
  createdTasks         Task[]                @relation("TaskCreator")
  assignedTasks        TaskAssignee[]
  createdEvents        Event[]               @relation("EventCreator")
  assignedEvents       EventAssignee[]
  eventShifts          EventShift[]
  comments             Comment[]
  weeklyLogs           WeeklyLog[]
  equipmentAssignments EquipmentAssignment[] @relation("EquipmentUser")
  createdAssignments   EquipmentAssignment[] @relation("AssignmentCreator")
  equipmentUsageLogs   EquipmentUsageLog[]

  @@index([role])
  @@index([isActive])
  @@map("users")
}

model TimeEntry {
  id         String    @id @default(uuid())
  userId     String    @map("user_id")
  eventId    String?   @map("event_id")
  clockIn    DateTime  @map("clock_in")
  clockOut   DateTime? @map("clock_out")
  totalHours Decimal?  @map("total_hours") @db.Decimal(5, 2)
  createdAt  DateTime  @default(now()) @map("created_at")

  user  User   @relation(fields: [userId], references: [id])
  event Event? @relation(fields: [eventId], references: [id])

  @@index([userId])
  @@index([eventId])
  @@index([clockIn])
  @@map("time_entries")
}

model Task {
  id                 String       @id @default(uuid())
  title              String       @db.VarChar(200)
  description        String       @db.Text
  clientRequirements String?      @map("client_requirements") @db.Text
  status             TaskStatus   @default(pending)
  priority           TaskPriority @default(medium)
  dueDate            DateTime     @map("due_date") @db.Date
  executionDate      DateTime?    @map("execution_date") @db.Date
  shift              String?      @db.VarChar(20)
  morningStartTime   String?      @map("morning_start_time") @db.VarChar(5)
  morningEndTime     String?      @map("morning_end_time") @db.VarChar(5)
  afternoonStartTime String?      @map("afternoon_start_time") @db.VarChar(5)
  afternoonEndTime   String?      @map("afternoon_end_time") @db.VarChar(5)
  createdBy          String       @map("created_by")
  createdAt          DateTime     @default(now()) @map("created_at")
  updatedAt          DateTime     @updatedAt @map("updated_at")

  creator   User           @relation("TaskCreator", fields: [createdBy], references: [id])
  assignees TaskAssignee[]
  comments  Comment[]

  @@index([status])
  @@index([priority])
  @@index([dueDate])
  @@index([executionDate])
  @@index([createdBy])
  @@map("tasks")
}

model TaskAssignee {
  taskId     String   @map("task_id")
  userId     String   @map("user_id")
  assignedAt DateTime @default(now()) @map("assigned_at")

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([taskId, userId])
  @@map("task_assignees")
}

model Event {
  id                 String    @id @default(uuid())
  name               String    @db.VarChar(200)
  description        String    @db.Text
  clientRequirements String?   @map("client_requirements") @db.Text
  eventType          EventType @map("event_type")
  startDatetime      DateTime  @map("start_datetime")
  endDatetime        DateTime  @map("end_datetime")
  morningStartTime   String?   @map("morning_start_time") @db.VarChar(5)
  morningEndTime     String?   @map("morning_end_time") @db.VarChar(5)
  afternoonStartTime String?   @map("afternoon_start_time") @db.VarChar(5)
  afternoonEndTime   String?   @map("afternoon_end_time") @db.VarChar(5)
  usePresetEquipment Boolean   @default(false) @map("use_preset_equipment")
  createdBy          String    @map("created_by")
  createdAt          DateTime  @default(now()) @map("created_at")

  creator              User                  @relation("EventCreator", fields: [createdBy], references: [id])
  assignees            EventAssignee[]
  timeEntries          TimeEntry[]
  equipmentAssignments EquipmentAssignment[]
  days                 EventDay[]

  @@index([eventType])
  @@index([startDatetime])
  @@index([endDatetime])
  @@index([createdBy])
  @@map("events")
}

model EventAssignee {
  eventId String @map("event_id")
  userId  String @map("user_id")

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([eventId, userId])
  @@map("event_assignees")
}

model EventDay {
  id        String   @id @default(uuid())
  eventId   String   @map("event_id")
  date      DateTime @db.Date
  note      String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  event  Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  shifts EventShift[]

  @@unique([eventId, date])
  @@index([eventId])
  @@index([date])
  @@map("event_days")
}

model EventShift {
  id         String   @id @default(uuid())
  eventDayId String   @map("event_day_id")
  userId     String   @map("user_id")
  startTime  String   @map("start_time") @db.VarChar(5)
  endTime    String   @map("end_time") @db.VarChar(5)
  shiftType  String?  @map("shift_type") @db.VarChar(20)
  note       String?  @db.Text
  createdAt  DateTime @default(now()) @map("created_at")

  eventDay             EventDay              @relation(fields: [eventDayId], references: [id], onDelete: Cascade)
  user                 User                  @relation(fields: [userId], references: [id])
  equipmentAssignments EquipmentAssignment[]

  @@index([eventDayId])
  @@index([userId])
  @@map("event_shifts")
}

model Comment {
  id        String   @id @default(uuid())
  taskId    String   @map("task_id")
  userId    String   @map("user_id")
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@index([taskId])
  @@index([userId])
  @@map("comments")
}

model WeeklyLog {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  weekStart    DateTime @map("week_start") @db.Date
  weekEnd      DateTime @map("week_end") @db.Date
  activities   String   @db.Text
  achievements String?  @db.Text
  challenges   String?  @db.Text
  learnings    String?  @db.Text
  nextGoals    String?  @map("next_goals") @db.Text
  totalHours   Decimal  @map("total_hours") @db.Decimal(5, 2)
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, weekStart])
  @@index([userId])
  @@index([weekStart])
  @@map("weekly_logs")
}

model Equipment {
  id           String            @id @default(uuid())
  name         String            @db.VarChar(200)
  category     EquipmentCategory
  status       EquipmentStatus   @default(available)
  description  String?           @db.Text
  serialNumber String?           @map("serial_number") @db.VarChar(100)
  rfidTag      String?           @unique @map("rfid_tag") @db.VarChar(50)
  isActive     Boolean           @default(true) @map("is_active")
  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @updatedAt @map("updated_at")

  assignments   EquipmentAssignment[]
  usageLogItems EquipmentUsageLogItem[]

  @@index([category])
  @@index([status])
  @@index([isActive])
  @@map("equipment")
}

model EquipmentAssignment {
  id           String    @id @default(uuid())
  equipmentId  String    @map("equipment_id")
  userId       String    @map("user_id")
  eventId      String?   @map("event_id")
  eventShiftId String?   @map("event_shift_id")
  startTime    DateTime  @map("start_time")
  endTime      DateTime? @map("end_time")
  notes        String?   @db.Text
  createdBy    String    @map("created_by")
  createdAt    DateTime  @default(now()) @map("created_at")

  equipment  Equipment   @relation(fields: [equipmentId], references: [id])
  user       User        @relation("EquipmentUser", fields: [userId], references: [id])
  event      Event?      @relation(fields: [eventId], references: [id])
  eventShift EventShift? @relation(fields: [eventShiftId], references: [id])
  creator    User        @relation("AssignmentCreator", fields: [createdBy], references: [id])

  @@index([equipmentId])
  @@index([userId])
  @@index([eventId])
  @@index([eventShiftId])
  @@index([startTime])
  @@map("equipment_assignments")
}

model PendingRfid {
  id          String   @id @default(uuid())
  rfidTag     String   @unique @map("rfid_tag") @db.VarChar(50)
  description String?  @db.Text
  scannedAt   DateTime @default(now()) @map("scanned_at")

  @@index([scannedAt])
  @@map("pending_rfids")
}

model EquipmentUsageLog {
  id       String   @id @default(uuid())
  userId   String   @map("user_id")
  loggedAt DateTime @default(now()) @map("logged_at")

  user  User                    @relation(fields: [userId], references: [id])
  items EquipmentUsageLogItem[]

  @@index([userId])
  @@index([loggedAt])
  @@map("equipment_usage_logs")
}

model EquipmentUsageLogItem {
  id          String @id @default(uuid())
  logId       String @map("log_id")
  equipmentId String @map("equipment_id")

  log       EquipmentUsageLog @relation(fields: [logId], references: [id], onDelete: Cascade)
  equipment Equipment         @relation(fields: [equipmentId], references: [id])

  @@index([logId])
  @@index([equipmentId])
  @@map("equipment_usage_log_items")
}
```

### Notas sobre el Esquema

**Campos Decimal de Prisma:**
- `totalHours` en TimeEntry y WeeklyLog son `Decimal(5,2)`
- Prisma devuelve Decimals como strings, **siempre convertir con `Number()`**

**Relaciones importantes:**
- User tiene múltiples relaciones con EquipmentAssignment (como usuario y como creador)
- Event tiene días (EventDay) que tienen turnos (EventShift)
- TaskAssignee y EventAssignee son tablas de unión many-to-many

---

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/login          # Iniciar sesión (retorna profileImage)
POST   /api/auth/logout         # Cerrar sesión
POST   /api/auth/refresh        # Refrescar token
GET    /api/auth/me             # Obtener usuario autenticado (incluye profileImage)
```

### Usuarios
```
GET    /api/users               # Listar usuarios (admin/supervisor)
GET    /api/users/me            # Obtener perfil actual
GET    /api/users/:id           # Obtener usuario por ID
POST   /api/users               # Crear usuario (admin)
PUT    /api/users/:id           # Actualizar usuario (admin)
DELETE /api/users/:id           # Eliminar usuario - soft delete (admin)
POST   /api/users/:id/profile-image   # Subir/cambiar foto de perfil
DELETE /api/users/:id/profile-image   # Eliminar foto de perfil
```

### Registro de Horas (Time Entries)
```
GET    /api/time-entries                # Listar registros (filtros: userId, dateFrom, dateTo)
GET    /api/time-entries/:id            # Obtener registro
GET    /api/time-entries/active         # Obtener sesión activa del usuario
GET    /api/time-entries/summary        # Resumen de horas (period: daily/weekly/monthly)
POST   /api/time-entries/clock-in       # Registrar entrada (usuario actual)
POST   /api/time-entries/clock-out      # Registrar salida (usuario actual)
POST   /api/time-entries/rfid           # Toggle entrada/salida via RFID
POST   /api/time-entries                # Crear entrada manual (admin/supervisor)
PUT    /api/time-entries/:id            # Actualizar entrada (admin/supervisor)
DELETE /api/time-entries/:id            # Eliminar entrada (admin/supervisor)
```

### Tareas
```
GET    /api/tasks               # Listar tareas (becarios solo ven sus tareas asignadas)
GET    /api/tasks/:id           # Obtener tarea con comentarios
POST   /api/tasks               # Crear tarea (admin/supervisor)
PUT    /api/tasks/:id           # Actualizar tarea
PATCH  /api/tasks/:id/status    # Cambiar estado
DELETE /api/tasks/:id           # Eliminar tarea (admin/supervisor)
POST   /api/tasks/:id/comments  # Agregar comentario
```

### Eventos
```
GET    /api/events                                 # Listar eventos (filtros: date_from, date_to)
GET    /api/events/upcoming                        # Próximos eventos (7 días)
GET    /api/events/:id                             # Obtener evento por ID
POST   /api/events                                 # Crear evento (admin/supervisor)
PUT    /api/events/:id                             # Actualizar evento (admin/supervisor)
DELETE /api/events/:id                             # Eliminar evento (admin)
POST   /api/events/:id/equipment/:userId/release   # Liberar equipo de usuario (admin/supervisor)
POST   /api/events/:id/equipment/:userId/transfer  # Transferir equipo a otro usuario (admin/supervisor)
```

### Bitácoras Semanales
```
GET    /api/weekly-logs                 # Listar bitácoras (filtros: user_id, week)
GET    /api/weekly-logs/:id             # Obtener bitácora
POST   /api/weekly-logs                 # Crear bitácora
PUT    /api/weekly-logs/:id             # Actualizar bitácora
GET    /api/weekly-logs/current-week    # Obtener/crear bitácora de la semana actual
GET    /api/weekly-logs/summary/:userId # Resumen para crear bitácora
```

### Equipos
```
GET    /api/equipment                   # Listar equipos (filtros: category, status, active)
GET    /api/equipment/:id               # Obtener equipo por ID
POST   /api/equipment                   # Crear equipo (admin/supervisor)
PUT    /api/equipment/:id               # Actualizar equipo (admin/supervisor)
DELETE /api/equipment/:id               # Eliminar equipo - soft delete (admin)
```

### Asignaciones de Equipos
```
GET    /api/equipment-assignments              # Listar asignaciones
POST   /api/equipment-assignments              # Crear asignación(es)
PUT    /api/equipment-assignments/:id          # Actualizar asignación
POST   /api/equipment-assignments/:id/return   # Devolver equipo
DELETE /api/equipment-assignments/:id          # Eliminar asignación
```

### Historial de Uso de Equipos (RFID)
```
POST   /api/equipment-loans/scan                        # Escaneo RFID desde ESP32 (público con API key)
GET    /api/equipment-loans/history                     # Historial de uso (filtros: userId, startDate, endDate)
GET    /api/equipment-loans/equipment/:equipmentId/history  # Historial de un equipo específico
GET    /api/equipment-loans/session                     # Ver sesión activa de escaneo
```

### Credenciales RFID Pendientes
```
GET    /api/rfid/pending                       # Listar tags RFID pendientes de asignar
DELETE /api/rfid/pending/:id                   # Eliminar tag pendiente
POST   /api/users/:id/rfid                     # Vincular RFID a usuario
DELETE /api/users/:id/rfid                     # Desvincular RFID de usuario
POST   /api/equipment/:id/rfid                 # Vincular RFID a equipo
DELETE /api/equipment/:id/rfid                 # Desvincular RFID de equipo
```

### Solicitudes de Eventos (Público)
```
GET    /api/event-requests/public/validate/:code    # Validar código de acceso
POST   /api/event-requests/public/submit/:code      # Enviar solicitud
GET    /api/event-requests/public/my-requests/:token # Ver mis solicitudes por token
POST   /api/event-requests/public/recover-access    # Solicitar recuperación de token
PUT    /api/event-requests/public/update/:id        # Editar solicitud (si cambios solicitados)
GET    /api/event-requests/public/status/:code      # Ver estado de solicitud
```

### Solicitudes de Eventos (Admin)
```
GET    /api/event-requests                     # Listar todas las solicitudes
GET    /api/event-requests/pending             # Listar pendientes
GET    /api/event-requests/stats               # Estadísticas
GET    /api/event-requests/config              # Obtener configuración
PUT    /api/event-requests/config              # Actualizar configuración
GET    /api/event-requests/recovery            # Solicitudes de recuperación pendientes
POST   /api/event-requests/recovery/:id/sent   # Marcar recuperación como enviada
DELETE /api/event-requests/recovery/:id        # Eliminar solicitud de recuperación
GET    /api/event-requests/:id                 # Ver detalle
POST   /api/event-requests/:id/approve         # Aprobar solicitud
POST   /api/event-requests/:id/reject          # Rechazar solicitud
POST   /api/event-requests/:id/request-changes # Solicitar cambios
```

### Reportes
```
GET    /api/reports/hours-by-user       # Horas por usuario
GET    /api/reports/hours-by-event      # Horas por evento
GET    /api/reports/tasks-summary       # Resumen de tareas
GET    /api/reports/productivity        # Productividad del equipo
GET    /api/reports/weekly-logs         # Reporte de bitácoras
GET    /api/reports/export/:type        # Exportar a Excel
```

---

## 🎨 Diseño y UI

### Paleta de Colores
```css
/* Colores principales */
--color-primary: #CC0000;      /* Rojo - Acento principal */
--color-secondary: #000000;    /* Negro - Texto principal */
--color-background: #FFFFFF;   /* Blanco - Fondo */
--color-gray-100: #F5F5F5;     /* Gris claro - Fondos secundarios */
--color-gray-300: #D4D4D4;     /* Gris - Bordes */
--color-gray-500: #737373;     /* Gris - Texto secundario */
--color-gray-700: #404040;     /* Gris oscuro - Texto */

/* Estados */
--color-success: #22C55E;      /* Verde - Completado */
--color-warning: #F59E0B;      /* Amarillo - En progreso */
--color-error: #EF4444;        /* Rojo - Error */
--color-info: #3B82F6;         /* Azul - Información */

/* Prioridades */
--priority-high: #EF4444;      /* Rojo */
--priority-medium: #F59E0B;    /* Amarillo */
--priority-low: #22C55E;       /* Verde */

/* Estados de tareas */
--status-pending: #9CA3AF;     /* Gris */
--status-in-progress: #3B82F6; /* Azul */
--status-review: #F59E0B;      /* Amarillo */
--status-completed: #22C55E;   /* Verde */
```

### Componentes UI Base
- Button (primary, secondary, outline, ghost, danger)
- Input (text, email, password, textarea)
- Select / Dropdown
- Card
- Modal / Dialog
- Table
- Badge (para estados y prioridades)
- Avatar (con soporte para profileImage)
- Tabs
- Toast / Notifications
- MonthSelector (navegación por mes)
- ProgressBar (barras de progreso)

---

## 👥 Roles y Permisos

### Administrador (admin)
- Acceso total al sistema
- Gestión de usuarios (CRUD completo)
- Crear/editar/eliminar tareas y eventos
- **Agregar/editar/eliminar horas de cualquier becario**
- Ver resumen de horas del equipo (TeamHoursOverview)
- Aprobar/rechazar tareas en revisión
- Ver todas las bitácoras
- Generar y exportar todos los reportes

### Supervisor (supervisor)
- Ver todos los usuarios
- Crear/editar tareas
- **Agregar/editar/eliminar horas de cualquier becario**
- Ver resumen de horas del equipo
- Aprobar/rechazar tareas en revisión
- Crear/editar eventos
- Ver bitácoras de su equipo
- Generar reportes

### Becario (becario)
- Registrar sus propias horas (clock in/out)
- **Ver solo tareas asignadas a él** (no todas las tareas)
- Ver resumen de horas personal (diario/semanal/mensual)
- Cambiar estado de sus tareas (hasta "review")
- Agregar comentarios en tareas
- Crear y editar su propia bitácora semanal
- Ver su historial de bitácoras

---

## 📝 Notas de Implementación

### Sistema de Horas por Rol

**Vista Becario (BecarioTimeEntries):**
- Selector de mes para navegar entre meses
- Resumen con 5 tarjetas: Hoy, Semana, Mes, Sesiones, En curso
- Botón de clock in/out (solo en mes actual)
- Historial de registros del mes

**Vista Admin/Supervisor (TeamHoursOverview):**
- Selector de mes
- Resumen del equipo (total becarios, horas totales, sesiones)
- Barra de progreso del equipo
- Cards por becario con horas y progreso
- Modal de detalle por becario con:
  - Gráfico de horas por semana
  - Lista de registros con editar/eliminar
  - Botón para agregar horas

**Modal AddTimeEntryModal:**
- Dos modos: Rápido y Manual
- Modo rápido: Botones 1-8 horas + hora de inicio
- Modo manual: Hora entrada/salida específica
- Selector de becario (solo al crear)
- Selector de evento opcional

### Filtrado de Tareas por Usuario

Los becarios solo ven tareas asignadas a ellos:
```typescript
// backend/src/services/task.service.ts
if (userRole === 'becario') {
  where.assignees = { some: { userId: userId } };
}
```

### Foto de Perfil en Header

El auth store refresca los datos del usuario al cargar la app:
```typescript
// frontend/src/stores/auth.store.tsx
useEffect(() => {
  if (user && token) {
    authService.getMe().then((freshUser) => {
      setUserState(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    });
  }
}, []);
```

### Manejo de Fechas Locales

Para comparar fechas correctamente sin problemas de timezone:
```typescript
// Usar fecha local, NO toISOString()
const getLocalDateStr = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const todayStr = getLocalDateStr(new Date());
const entryDateStr = getLocalDateStr(new Date(entry.clockIn));
```

### Conversión de Decimals de Prisma

**IMPORTANTE:** Prisma devuelve campos Decimal como strings, siempre convertir:
```typescript
// ❌ INCORRECTO - puede concatenar strings
const total = entries.reduce((acc, e) => acc + (e.totalHours || 0), 0);

// ✅ CORRECTO - convierte a número
const total = entries.reduce((acc, e) => acc + Number(e.totalHours || 0), 0);
```

### Tablero Kanban

Sistema de gestión visual de tareas con drag & drop usando `@dnd-kit`:

**Componentes:**
- `KanbanBoard.tsx` - Contexto DnD y lógica de movimiento
- `KanbanColumn.tsx` - Columnas por estado (Pendiente, En Progreso, En Revisión, Completado)
- `KanbanCard.tsx` - Tarjeta arrastrable con manija de arrastre

**Restricciones por rol:**
- Admin/Supervisor: pueden mover cualquier tarea a cualquier estado
- Becario: solo sus tareas asignadas, NO pueden mover directamente a "Completado"

**Toggle de vista:** Botones Lista/Tablero en la página de Tareas

### Tablero Kanban de Eventos

Vista de tablero para eventos organizada por estado temporal (sin drag & drop):

**Componentes:**
- `EventKanbanBoard.tsx` - Contenedor principal con las 3 columnas
- `EventKanbanColumn.tsx` - Columnas por estado temporal
- `EventKanbanCard.tsx` - Tarjeta compacta del evento

**Columnas:**
- **Próximos** (azul): Eventos que aún no han comenzado
- **En Curso** (verde): Eventos actualmente en progreso
- **Finalizados** (gris): Eventos ya terminados

**Características:**
- Selector de mes para filtrar eventos
- Toggle Lista/Tablero en la página de Eventos
- Cards compactas con tipo de evento, fechas y conteo de turnos

### Deep Linking para Notificaciones

Las notificaciones pueden abrir directamente el modal de una tarea o evento:

**Implementación:**
- URL parameter `?open=ID` en Tasks.tsx y Events.tsx
- `useSearchParams` de React Router para leer el parámetro
- useEffect que abre el modal correspondiente al cargar la página

**Ejemplo de uso:**
```typescript
// En NotificationDropdown, al hacer clic en una notificación:
navigate(`/tasks?open=${notification.taskId}`);
```

### Sistema de Notificaciones

Notificaciones automáticas para eventos del sistema:

**Tipos de notificación:**
- `task_assigned` - Nueva tarea asignada
- `task_review` - Tarea enviada a revisión
- `task_comment` - Nuevo comentario en tarea
- `event_assigned` - Nuevo evento asignado

**Backend:**
- Modelo `Notification` en Prisma
- Servicio `notification.service.ts` con `create()`, `createForMany()`, `markAsRead()`
- Integrado en `task.service.ts`, `event.service.ts`, `comment.service.ts`

**Frontend:**
- `NotificationDropdown.tsx` en el Header
- Polling cada 30 segundos
- Badge con contador de no leídas
- Click para marcar como leída y navegar

### Sistema de Chat Interno

Chat en tiempo real entre usuarios:

**Modelos:**
- `Conversation` - Conversaciones (individuales o grupales)
- `ConversationParticipant` - Participantes
- `Message` - Mensajes con soporte para adjuntos

**Componentes:**
- `Chat.tsx` - Página principal
- `ConversationList.tsx` - Lista de conversaciones
- `ChatWindow.tsx` - Ventana de chat activa
- `MessageInput.tsx` - Input de mensaje con adjuntos

### Archivos Adjuntos

Sistema de subida y descarga de archivos:

**Backend:**
- Middleware `upload.middleware.ts` con Multer
- Almacenamiento en `backend/uploads/attachments/`
- Endpoints: `POST /attachments`, `GET /attachments/:id/download`, `GET /attachments/:id/preview`

**Frontend:**
- `AttachmentsList.tsx` - Lista de adjuntos con acciones
- `AttachmentPreviewModal.tsx` - Vista previa (imágenes, PDFs, videos, texto)
- Descarga autenticada usando blob URLs

### Exportar Tarea como PNG

Funcionalidad para exportar tareas como imagen:

**Dependencia:** `html-to-image`

**Componentes:**
- `TaskExportView.tsx` - Vista formateada para exportar (600px, estilos inline)
- `exportTaskToImage.ts` - Utilidad de exportación

**Flujo:**
1. Click en icono Download en TaskModal
2. Se abre modal con vista previa
3. Click en "Descargar PNG"
4. Se genera imagen con resolución 2x

### Sistema RFID y Credenciales

Sistema completo de gestión de credenciales RFID para usuarios y equipos:

**Flujo de escaneo RFID:**
1. ESP32 envía tag RFID a `/api/equipment-loans/scan` con API key
2. Sistema identifica si es usuario o equipo
3. Si es usuario: inicia sesión de uso de equipos (3 min timeout)
4. Si es equipo: registra uso del equipo en la sesión activa
5. Tags desconocidos se guardan como `PendingRfid`

**Sesión de uso de equipos:**
- Una sola sesión activa a la vez (en memoria)
- Timeout de 3 minutos después del último escaneo de equipo
- Al cerrar sesión, se crea `EquipmentUsageLog` con todos los equipos escaneados

**Gestión de RFID pendientes (RfidManagement.tsx):**
- Toggle para asignar a Usuario o Equipo
- Lista de tags pendientes con opción de eliminar
- Selector de usuario/equipo para vincular
- Se elimina automáticamente de pendientes al vincular

**RFID en equipos (EquipmentModal.tsx):**
- Sección RFID en el modal de edición
- Muestra tag actual o permite vincular uno nuevo
- Input manual de tag RFID
- Opción de desvincular

**Backend:**
- `rfid.controller.ts` - Endpoints para gestión de pendientes
- `equipment-loan.service.ts` - Lógica de sesiones y logging
- Variable de entorno: `RFID_API_KEY` para autenticar ESP32

### Historial de Uso de Equipos

Vista simplificada del uso de equipos (EquipmentLoans.tsx):

**Características:**
- Historial agrupado por fecha (Hoy, Ayer, fechas anteriores)
- Cards por log con avatar del usuario y equipos usados
- Filtros por usuario y rango de fechas
- Polling cada 10 segundos para actualizaciones
- Iconos por categoría de equipo (📷 cámara, 🔭 lente, 💾 SD, 🔌 adaptador)

**Estructura de datos:**
```typescript
interface EquipmentUsageLog {
  id: string;
  userId: string;
  loggedAt: string;
  user: { id: string; name: string; profileImage?: string };
  items: Array<{
    id: string;
    equipment: { id: string; name: string; category: string };
  }>;
}
```

---

## 🔧 Comandos Útiles

### Frontend
```bash
cd frontend
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Ejecutar ESLint
npm run type-check   # Verificar tipos TypeScript (npx tsc --noEmit)
```

### Backend
```bash
cd backend
npm run dev          # Iniciar con tsx watch
npm run build        # Compilar TypeScript
npm run start        # Iniciar producción

# Prisma
npx prisma generate  # Generar cliente Prisma
npx prisma migrate dev --name nombre_migracion  # Crear migración
npx prisma migrate deploy  # Aplicar migraciones en producción
npx prisma studio    # Abrir GUI de base de datos
npx prisma db seed   # Ejecutar seeds
```

### Git
```bash
git add .
git commit -m "tipo(alcance): descripción"

# Tipos de commit:
# feat: nueva funcionalidad
# fix: corrección de bug
# docs: documentación
# style: formato
# refactor: refactorización
# test: tests
# chore: mantenimiento
```

---

## 🆘 Troubleshooting Común

### Error: Prisma Decimal como string

**Problema:** `totalHours.toFixed is not a function`

**Causa:** Prisma devuelve Decimal como string, no como number.

**Solución:**
```typescript
// Siempre usar Number() al sumar o mostrar
const total = entries.reduce((acc, e) => acc + Number(e.totalHours || 0), 0);
{Number(entry.totalHours).toFixed(1)}h
```

### Error: Fechas muestran día incorrecto (timezone)

**Problema:** Una fecha guardada como 2024-01-15 se muestra como 2024-01-14.

**Causa:** Conversión UTC vs hora local.

**Solución en frontend:**
```typescript
// Para comparar fechas, usar hora local
const getLocalDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Para mostrar fechas DATE de Prisma
const formatDate = (dateString: string) => {
  const datePart = dateString.split('T')[0];
  const date = new Date(datePart + 'T12:00:00'); // Usar mediodía
  return date.toLocaleDateString('es-MX');
};
```

**Solución en backend:**
```typescript
// Al parsear fechas DATE
function parseDateSafe(val: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return new Date(val + 'T12:00:00');
  }
  return new Date(val);
}
```

### Error: Horas no se suman correctamente

**Problema:** El resumen muestra "0481" en lugar de "12" horas.

**Causa:** String concatenation en lugar de suma numérica.

**Solución:**
```typescript
// ❌ Incorrecto
acc + (e.totalHours || 0)  // "0" + "4" + "8" = "048"

// ✅ Correcto
acc + Number(e.totalHours || 0)  // 0 + 4 + 8 = 12
```

### Error: Becario ve todas las tareas

**Problema:** Un becario puede ver tareas que no le fueron asignadas.

**Solución:** Verificar que el servicio filtre por assignee:
```typescript
// backend/src/services/task.service.ts
async findAll(query, userId, userRole) {
  const where = {};

  if (userRole === 'becario') {
    where.assignees = { some: { userId: userId } };
  }
  // ...
}
```

### Error: Foto de perfil no aparece en header

**Problema:** La foto se sube pero no se muestra en el header.

**Solución:**
1. Verificar que `/api/auth/me` incluya `profileImage` en la respuesta
2. Verificar que el auth store refresque los datos del usuario
3. Verificar la URL: `{API_BASE}/uploads/profiles/{filename}`

### Error: Selectores de equipo vacíos al editar evento

**Problema:** Al editar un evento, los selectores de equipo aparecen vacíos aunque hay equipos asignados en la base de datos.

**Causa:** El `ShiftEquipmentSelector` solo consultaba equipos "disponibles", pero el equipo ya asignado a este evento no aparecía porque estaba marcado como "en uso".

**Solución implementada:**
- `ShiftEquipmentSelector` ahora consulta TODOS los equipos activos además de los disponibles
- El equipo actualmente seleccionado siempre aparece en las opciones y nunca está deshabilitado
- Los equipos no disponibles se muestran con "(no disponible)" pero el actual siempre está visible

```typescript
// En ShiftEquipmentSelector.tsx
const { data: allEquipmentResponse } = useQuery({
  queryKey: ['equipment', { isActive: true, limit: 100 }],
  queryFn: () => equipmentService.getAll({ isActive: true, limit: 100 }),
});

// En getOptions: el equipo actual nunca se deshabilita
const isCurrentSelection = eq.id === currentValue;
disabled: isCurrentSelection ? false : (isExcludedInForm || isUnavailable),
```

### Error de conexión a PostgreSQL
```bash
# Verificar que PostgreSQL esté corriendo
sudo service postgresql status

# Verificar DATABASE_URL en .env
DATABASE_URL="postgresql://user:password@localhost:5432/pulso_db"
```

### Error de Prisma
```bash
# Regenerar cliente después de cambios en schema
npx prisma generate

# Si hay conflictos de migración
npx prisma migrate reset  # ⚠️ BORRA TODOS LOS DATOS
```

### Error de CORS
```typescript
// En backend/src/index.ts
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## 📋 Checklist de Funcionalidades

### MVP (Semana 1-2) ✅
- [x] Setup inicial del proyecto
- [x] Configurar base de datos y Prisma
- [x] API de autenticación (login/logout/JWT)
- [x] CRUD de usuarios
- [x] Sistema de registro de horas (manual)
- [x] CRUD de tareas con estados
- [x] Frontend: Login, Dashboard, Lista de tareas

### Fase 2 (Semana 2-3) ✅
- [x] Sistema de comentarios en tareas
- [x] CRUD de eventos
- [x] Asignación múltiple en tareas/eventos
- [x] Bitácora semanal
- [x] Requisitos del cliente en tareas/eventos
- [x] Frontend: Detalle de tarea, Eventos, Bitácora

### Fase 3 (Semana 3-4) ✅
- [x] Calendario nativo (vistas mes, semana, día)
- [x] Sistema de reportes
- [x] Exportación a Excel
- [x] Gestión de equipos (CRUD + asignaciones)
- [x] Eventos multi-día con tipos
- [x] Plantillas rápidas de tareas
- [x] Fotos de perfil de usuarios
- [x] Vista de horas por mes para becarios
- [x] Resumen diario/semanal/mensual de horas
- [x] Admin puede agregar/editar/eliminar horas
- [x] Modo rápido para agregar horas (1-8h)
- [x] Filtrado de tareas por asignado (becarios)
- [x] Foto de perfil visible en header

### Fase 4 (Extras) ✅
- [x] Checklist en tareas (subtareas)
- [x] Archivos adjuntos en tareas y eventos
- [x] Vista previa de archivos adjuntos
- [x] Sistema de chat interno
- [x] Sistema de notificaciones
- [x] Búsqueda global (Ctrl+K)
- [x] Tablero Kanban con drag & drop
- [x] Exportar tarea como imagen PNG

### Fase 5 (Sistema RFID) ✅
- [x] Sistema RFID para tracking de equipos
- [x] Gestión de credenciales RFID pendientes
- [x] Asignación de RFID a usuarios y equipos
- [x] Historial de uso de equipos con filtros
- [x] Sesiones de escaneo con timeout automático

### Fase 6 (Portal Público y Seguridad) ✅
- [x] Portal público de solicitudes de eventos
- [x] Formulario de solicitud con código de acceso
- [x] Sistema de tokens de 6 dígitos para solicitantes
- [x] Recuperación manual de tokens (admin)
- [x] Gestión de solicitudes (aprobar/rechazar/solicitar cambios)
- [x] Eventos ordenados: próximos primero, pasados al final
- [x] Seguridad: Helmet (headers HTTP)
- [x] Seguridad: Rate limiting (general, login, formulario público)
- [x] Seguridad: CORS restrictivo en producción
- [x] Seguridad: Trust proxy para Cloudflare

### Pendiente
- [ ] App móvil (React Native)
- [ ] Testing automatizado
- [ ] Despliegue en producción

---

## 🚀 Variables de Entorno

```env
# .env.example

# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/pulso_db"
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RFID_API_KEY=your-rfid-api-key-for-esp32

# Frontend
VITE_API_URL=http://localhost:3000/api
```

---

**Última actualización:** 14 Enero 2026
**Versión del documento:** 3.4
