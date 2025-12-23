# PULSO - Sistema de Gestión de Horas y Tareas

## 📋 Descripción del Proyecto

PULSO es un sistema de gestión de horas de trabajo y tareas para una oficina de creación multimedia universitaria. El sistema permite:

- Registro de horas de trabajo mediante lector RFID (credenciales universitarias)
- Gestión de tareas con flujo de estados y prioridades
- Gestión de eventos especiales con asignación de personal
- Gestión de equipos con asignación por turnos no solapados
- Calendario nativo con vistas de mes, semana y dia
- Bitácora semanal para que los becarios documenten su progreso
- Reportes exportables a Excel

**Usuarios:** 8-12 becarios + 1 jefe de departamento

**Plazo de desarrollo:** 1 mes

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
│   │   │   └── Reports.tsx
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
│   │   ├── middlewares/      # Middlewares (auth, validation, etc.)
│   │   ├── services/         # Lógica de negocio
│   │   ├── schemas/          # Esquemas de validación Zod
│   │   ├── utils/            # Funciones utilitarias
│   │   ├── types/            # TypeScript interfaces/types
│   │   └── config/           # Configuraciones
│   ├── prisma/
│   │   ├── schema.prisma     # Esquema de base de datos
│   │   └── migrations/       # Migraciones
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

## 🗄️ Esquema de Base de Datos

### Tabla: users
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| name | VARCHAR(100) | Nombre completo |
| email | VARCHAR(255) UNIQUE | Correo electrónico |
| password_hash | VARCHAR(255) | Contraseña encriptada con bcrypt |
| rfid_tag | VARCHAR(50) UNIQUE NULL | ID de credencial RFID (opcional) |
| role | ENUM('admin', 'supervisor', 'becario') | Rol del usuario |
| is_active | BOOLEAN DEFAULT true | Estado activo/inactivo |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de actualización |

### Tabla: time_entries
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| user_id | UUID (FK → users) | Referencia al usuario |
| event_id | UUID (FK → events, NULL) | Referencia al evento (opcional) |
| clock_in | TIMESTAMP | Hora de entrada |
| clock_out | TIMESTAMP NULL | Hora de salida |
| total_hours | DECIMAL(5,2) | Horas calculadas automáticamente |
| created_at | TIMESTAMP | Fecha de creación |

### Tabla: tasks
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| title | VARCHAR(200) | Título de la tarea |
| description | TEXT | Descripción detallada |
| client_requirements | TEXT NULL | Requisitos específicos del cliente (opcional) |
| status | ENUM('pending', 'in_progress', 'review', 'completed') | Estado |
| priority | ENUM('high', 'medium', 'low') | Prioridad |
| due_date | DATE | Fecha límite |
| created_by | UUID (FK → users) | Creador de la tarea |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de actualización |

### Tabla: task_assignees (Many-to-Many)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| task_id | UUID (FK → tasks, PK) | Referencia a la tarea |
| user_id | UUID (FK → users, PK) | Referencia al usuario asignado |
| assigned_at | TIMESTAMP | Fecha de asignación |

### Tabla: events
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| name | VARCHAR(200) | Nombre del evento |
| description | TEXT | Descripción |
| client_requirements | TEXT NULL | Requisitos del cliente (opcional) |
| start_datetime | TIMESTAMP | Fecha y hora de inicio |
| end_datetime | TIMESTAMP | Fecha y hora de fin |
| created_by | UUID (FK → users) | Creador del evento |
| created_at | TIMESTAMP | Fecha de creación |

### Tabla: event_assignees (Many-to-Many)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| event_id | UUID (FK → events, PK) | Referencia al evento |
| user_id | UUID (FK → users, PK) | Referencia al usuario asignado |

### Tabla: comments
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| task_id | UUID (FK → tasks) | Tarea asociada |
| user_id | UUID (FK → users) | Autor del comentario |
| content | TEXT | Contenido del comentario |
| created_at | TIMESTAMP | Fecha de creación |

### Tabla: weekly_logs (Bitácoras Semanales)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| user_id | UUID (FK → users) | Autor de la bitácora |
| week_start | DATE | Fecha de inicio de semana (lunes) |
| week_end | DATE | Fecha de fin de semana (domingo) |
| activities | TEXT | Actividades realizadas |
| achievements | TEXT NULL | Logros destacados (opcional) |
| challenges | TEXT NULL | Dificultades encontradas (opcional) |
| learnings | TEXT NULL | Aprendizajes (opcional) |
| next_goals | TEXT NULL | Objetivos próxima semana (opcional) |
| total_hours | DECIMAL(5,2) | Total horas (calculado automáticamente) |
| created_at | TIMESTAMP | Fecha de creación |

### Tabla: equipment (Equipos)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| name | VARCHAR(200) | Nombre del equipo |
| description | TEXT NULL | Descripción del equipo |
| category | ENUM('camera', 'audio', 'lighting', 'computer', 'other') | Categoría |
| serial_number | VARCHAR(100) UNIQUE NULL | Número de serie |
| status | ENUM('available', 'in_use', 'maintenance', 'retired') | Estado actual |
| is_active | BOOLEAN DEFAULT true | Estado activo/inactivo |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de actualización |

### Tabla: equipment_assignments (Asignaciones de Equipos)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| equipment_id | UUID (FK → equipment) | Referencia al equipo |
| user_id | UUID (FK → users) | Usuario responsable |
| event_id | UUID (FK → events, NULL) | Evento asociado (opcional) |
| start_time | TIMESTAMP | Inicio del turno/asignación |
| end_time | TIMESTAMP NULL | Fin del turno (null = indefinido) |
| notes | TEXT NULL | Notas adicionales |
| created_by | UUID (FK → users) | Quien creó la asignación |
| created_at | TIMESTAMP | Fecha de creación |

**Nota sobre validación de asignaciones:**
- Un equipo puede tener múltiples asignaciones si los horarios NO se solapan
- El estado `in_use` solo se aplica si hay un turno activo en el momento actual
- Solapamiento = `new.startTime < existing.endTime AND new.endTime > existing.startTime`

---

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/login          # Iniciar sesión
POST   /api/auth/logout         # Cerrar sesión
POST   /api/auth/refresh        # Refrescar token
GET    /api/auth/me             # Obtener usuario autenticado
```

### Usuarios
```
GET    /api/users               # Listar usuarios (admin/supervisor)
GET    /api/users/me            # Obtener perfil actual
GET    /api/users/:id           # Obtener usuario por ID
POST   /api/users               # Crear usuario (admin)
PUT    /api/users/:id           # Actualizar usuario (admin)
DELETE /api/users/:id           # Eliminar usuario - soft delete (admin)
```

### Registro de Horas (Time Entries)
```
GET    /api/time-entries                # Listar registros (filtros: user_id, date_from, date_to)
GET    /api/time-entries/:id            # Obtener registro
POST   /api/time-entries/clock-in       # Registrar entrada
POST   /api/time-entries/clock-out      # Registrar salida
POST   /api/time-entries/rfid           # Registro via RFID (toggle entrada/salida)
GET    /api/time-entries/active         # Obtener sesión activa del usuario
GET    /api/time-entries/summary        # Resumen de horas (diario/semanal/mensual)
```

### Tareas
```
GET    /api/tasks               # Listar tareas (filtros: status, priority, assignee, due_date)
GET    /api/tasks/:id           # Obtener tarea con comentarios
POST   /api/tasks               # Crear tarea (admin/supervisor)
PUT    /api/tasks/:id           # Actualizar tarea
PATCH  /api/tasks/:id/status    # Cambiar estado
DELETE /api/tasks/:id           # Eliminar tarea (admin/supervisor)
POST   /api/tasks/:id/comments  # Agregar comentario
```

### Eventos
```
GET    /api/events              # Listar eventos (filtros: date_from, date_to)
GET    /api/events/upcoming     # Próximos eventos (7 días)
GET    /api/events/:id          # Obtener evento por ID
POST   /api/events              # Crear evento (admin/supervisor)
PUT    /api/events/:id          # Actualizar evento (admin/supervisor)
DELETE /api/events/:id          # Eliminar evento (admin)
```

### Bitácoras Semanales
```
GET    /api/weekly-logs                 # Listar bitácoras (filtros: user_id, week)
GET    /api/weekly-logs/:id             # Obtener bitácora
POST   /api/weekly-logs                 # Crear bitácora
PUT    /api/weekly-logs/:id             # Actualizar bitácora
GET    /api/weekly-logs/current-week    # Obtener/crear bitácora de la semana actual
GET    /api/weekly-logs/summary/:userId # Resumen para crear bitácora (tareas completadas, horas)
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
GET    /api/equipment-assignments              # Listar asignaciones (filtros: equipmentId, userId, eventId, active)
GET    /api/equipment-assignments/:id          # Obtener asignación por ID
POST   /api/equipment-assignments              # Crear asignación(es) - soporta múltiples equipos
PUT    /api/equipment-assignments/:id          # Actualizar asignación
POST   /api/equipment-assignments/:id/return   # Devolver equipo (marcar endTime)
DELETE /api/equipment-assignments/:id          # Eliminar asignación
```

**Lógica de asignación de equipos:**
- `equipmentIds`: Array de IDs de equipos a asignar
- `startTime`: Inicio del turno (requerido)
- `endTime`: Fin del turno (opcional, null = indefinido)
- Validación: No permite asignaciones con horarios solapados
- Estado `in_use`: Solo si `startTime <= now AND (endTime is null OR endTime > now)`
- Función `isTimeOverlapping(start1, end1, start2, end2)`: Detecta solapamiento de turnos
- Función `syncEquipmentStatuses()`: Sincroniza estados al consultar equipos
- Mensajes de error claros: "El equipo X está asignado a Y el DD/MM de HH:MM a HH:MM"

### Reportes
```
GET    /api/reports/hours-by-user       # Horas por usuario
GET    /api/reports/hours-by-event      # Horas por evento
GET    /api/reports/tasks-summary       # Resumen de tareas
GET    /api/reports/productivity        # Productividad del equipo
GET    /api/reports/weekly-logs         # Reporte de bitácoras
GET    /api/reports/export/:type        # Exportar a Excel (type: hours, tasks, logs)
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

### Principios de Diseño
- **Minimalista:** Interfaz limpia sin elementos innecesarios
- **Tipografía:** Inter o SF Pro (sans-serif moderna)
- **Espaciado:** Consistente usando escala de 4px (4, 8, 12, 16, 24, 32, 48)
- **Bordes:** Redondeados sutiles (4px - 8px)
- **Sombras:** Mínimas, solo para elevación de cards y modals
- **Responsive:** Mobile-first, breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)

### Componentes UI Base
- Button (primary, secondary, outline, ghost, danger)
- Input (text, email, password, textarea)
- Select / Dropdown
- Card
- Modal / Dialog
- Table
- Badge (para estados y prioridades)
- Avatar
- Tabs
- Toast / Notifications

---

## 👥 Roles y Permisos

### Administrador (admin)
- Acceso total al sistema
- Gestión de usuarios (CRUD completo)
- Crear/editar/eliminar tareas y eventos
- Aprobar/rechazar tareas en revisión
- Ver todas las bitácoras
- Generar y exportar todos los reportes
- Agregar requisitos del cliente

### Supervisor (supervisor)
- Ver todos los usuarios
- Crear/editar tareas
- Aprobar/rechazar tareas en revisión
- Crear/editar eventos
- Ver bitácoras de su equipo
- Generar reportes
- Agregar requisitos del cliente

### Becario (becario)
- Registrar sus propias horas (RFID)
- Ver y actualizar tareas asignadas
- Ver tareas de compañeros (solo lectura)
- Cambiar estado de sus tareas (hasta "review")
- Agregar comentarios en tareas
- Crear y editar su propia bitácora semanal
- Ver su historial de bitácoras

---

## 📝 Convenciones de Código

### Nomenclatura
```typescript
// Archivos: kebab-case
user-service.ts
time-entry-controller.ts
use-auth.ts

// Componentes React: PascalCase
TaskCard.tsx
WeeklyLogForm.tsx

// Variables y funciones: camelCase
const userName = "John";
function calculateTotalHours() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5000000;
const API_BASE_URL = "http://localhost:3000";

// Tipos e Interfaces: PascalCase con prefijo I para interfaces (opcional)
type UserRole = 'admin' | 'supervisor' | 'becario';
interface User { ... }

// Enums: PascalCase
enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Review = 'review',
  Completed = 'completed'
}
```

### Estructura de Componentes React
```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types/Interfaces
interface TaskCardProps {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
}

// 3. Component
export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  // 3.1 Hooks
  const [isOpen, setIsOpen] = useState(false);
  
  // 3.2 Derived state / calculations
  const isOverdue = new Date(task.dueDate) < new Date();
  
  // 3.3 Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 3.4 Handlers
  const handleClick = () => {
    setIsOpen(true);
  };
  
  // 3.5 Render
  return (
    <div>...</div>
  );
}
```

### Estructura de Controladores (Backend)
```typescript
// user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../utils/app-error';

export const userController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.findAll();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
};
```

### Respuestas de API
```typescript
// Éxito
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 10 } // opcional, para paginación
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [...] // opcional
  }
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
npm run lint:fix     # Corregir errores de ESLint
npm run type-check   # Verificar tipos TypeScript
```

### Backend
```bash
cd backend
npm run dev          # Iniciar con nodemon
npm run build        # Compilar TypeScript
npm run start        # Iniciar producción
npm run lint         # Ejecutar ESLint

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
git commit -m "tipo(alcance): descripción"  # Conventional Commits
git push origin main

# Tipos de commit:
# feat: nueva funcionalidad
# fix: corrección de bug
# docs: documentación
# style: formato (no afecta código)
# refactor: refactorización
# test: agregar tests
# chore: tareas de mantenimiento
```

---

## ⚠️ Reglas y Restricciones

### Seguridad
- NUNCA almacenar contraseñas en texto plano (usar bcrypt)
- NUNCA exponer información sensible en logs
- SIEMPRE validar y sanitizar inputs del usuario
- SIEMPRE usar HTTPS en producción
- Tokens JWT deben expirar (access: 15min, refresh: 7 días)

### Base de Datos
- SIEMPRE usar UUID para IDs
- SIEMPRE incluir created_at y updated_at
- NUNCA eliminar registros físicamente (usar soft delete con is_active)
- Usar transacciones para operaciones múltiples

### Código
- Máximo 300 líneas por archivo
- Máximo 50 líneas por función
- No usar `any` en TypeScript (usar `unknown` si es necesario)
- Siempre manejar errores con try/catch
- Siempre tipar parámetros y retornos de funciones

### API
- Usar códigos HTTP correctos (200, 201, 400, 401, 403, 404, 500)
- Implementar rate limiting en producción
- Paginar resultados de listas (default: 10 items, max: 100)
- Versionar API si hay breaking changes (/api/v1/, /api/v2/)

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

# Frontend
VITE_API_URL=http://localhost:3000/api
```

---

## 📋 Checklist de Funcionalidades

### MVP (Semana 1-2) ✅
- [x] Setup inicial del proyecto (monorepo)
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

### Fase 3 (Semana 3-4) - En progreso
- [ ] Integración RFID (endpoint listo, pendiente hardware)
- [x] Calendario nativo (vistas mes, semana, dia)
- [x] Sistema de reportes
- [x] Exportación a Excel
- [x] Gestión de equipos (CRUD + asignaciones con validación de turnos)
- [ ] App móvil (React Native)
- [ ] Testing y corrección de bugs
- [ ] Despliegue

---

## 🆘 Troubleshooting Común

### Error de conexión a PostgreSQL
```bash
# Verificar que PostgreSQL esté corriendo
sudo service postgresql status

# Verificar credenciales en .env
# DATABASE_URL debe tener el formato correcto
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
  origin: 'http://localhost:5173', // URL del frontend
  credentials: true
}));
```

### Error de tipos TypeScript
```bash
# Limpiar cache y reinstalar
rm -rf node_modules
rm package-lock.json
npm install
```

---

**Última actualización:** 23 Diciembre 2024
**Versión del documento:** 2.3
