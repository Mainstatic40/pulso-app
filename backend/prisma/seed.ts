import { PrismaClient, UserRole, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.comment.deleteMany();
  await prisma.weeklyLog.deleteMany();
  await prisma.eventAssignee.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create password hash (same password for all test users: "password123")
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'Carlos García',
      email: 'admin@pulso.edu.mx',
      passwordHash,
      rfidTag: 'RFID001',
      role: UserRole.admin,
      isActive: true,
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      name: 'María López',
      email: 'supervisor@pulso.edu.mx',
      passwordHash,
      rfidTag: 'RFID002',
      role: UserRole.supervisor,
      isActive: true,
    },
  });

  const becario1 = await prisma.user.create({
    data: {
      name: 'Juan Hernández',
      email: 'juan@pulso.edu.mx',
      passwordHash,
      rfidTag: 'RFID003',
      role: UserRole.becario,
      isActive: true,
    },
  });

  const becario2 = await prisma.user.create({
    data: {
      name: 'Ana Martínez',
      email: 'ana@pulso.edu.mx',
      passwordHash,
      rfidTag: 'RFID004',
      role: UserRole.becario,
      isActive: true,
    },
  });

  const becario3 = await prisma.user.create({
    data: {
      name: 'Pedro Sánchez',
      email: 'pedro@pulso.edu.mx',
      passwordHash,
      rfidTag: 'RFID005',
      role: UserRole.becario,
      isActive: true,
    },
  });

  console.log('👥 Created 5 users (1 admin, 1 supervisor, 3 becarios)');

  // Create some tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Diseño de identidad visual para evento de bienvenida',
      description: 'Crear logos, paleta de colores y materiales gráficos para el evento de bienvenida de nuevos estudiantes.',
      clientRequirements: 'Usar colores institucionales. Entregar en formatos PNG, SVG y PDF.',
      status: TaskStatus.in_progress,
      priority: TaskPriority.high,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: admin.id,
      assignees: {
        create: [
          { userId: becario1.id },
          { userId: becario2.id },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Video promocional de la carrera de Ingeniería',
      description: 'Producir un video de 2 minutos destacando las instalaciones y testimonios de estudiantes.',
      status: TaskStatus.pending,
      priority: TaskPriority.medium,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      createdBy: supervisor.id,
      assignees: {
        create: [
          { userId: becario3.id },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Actualización de redes sociales',
      description: 'Programar publicaciones para la semana en Instagram y Facebook.',
      status: TaskStatus.completed,
      priority: TaskPriority.low,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      createdBy: supervisor.id,
      assignees: {
        create: [
          { userId: becario1.id },
        ],
      },
    },
  });

  console.log('📋 Created 3 tasks');

  // Create some comments
  await prisma.comment.createMany({
    data: [
      {
        taskId: task1.id,
        userId: becario1.id,
        content: 'Ya tengo los primeros bocetos listos, los subiré mañana para revisión.',
      },
      {
        taskId: task1.id,
        userId: supervisor.id,
        content: 'Perfecto, recuerden que el cliente quiere ver opciones de al menos 3 propuestas.',
      },
      {
        taskId: task2.id,
        userId: becario3.id,
        content: '¿Tenemos acceso a las instalaciones para grabar el viernes?',
      },
    ],
  });

  console.log('💬 Created 3 comments');

  // Create an event
  const event = await prisma.event.create({
    data: {
      name: 'Congreso de Innovación Tecnológica',
      description: 'Cobertura multimedia del congreso anual. Se requiere fotografía, video y transmisión en vivo.',
      clientRequirements: 'Entregar resumen en video de 5 min máximo 24 horas después del evento.',
      startDatetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      endDatetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // +8 hours
      createdBy: admin.id,
      assignees: {
        create: [
          { userId: becario1.id },
          { userId: becario2.id },
          { userId: becario3.id },
        ],
      },
    },
  });

  console.log('📅 Created 1 event');

  // Create some time entries
  const today = new Date();
  today.setHours(9, 0, 0, 0);

  await prisma.timeEntry.create({
    data: {
      userId: becario1.id,
      clockIn: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday 9:00
      clockOut: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Yesterday 13:00
      totalHours: 4.0,
    },
  });

  await prisma.timeEntry.create({
    data: {
      userId: becario2.id,
      clockIn: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday 9:00
      clockOut: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // Yesterday 14:00
      totalHours: 5.0,
    },
  });

  // Active session (no clock out)
  await prisma.timeEntry.create({
    data: {
      userId: becario1.id,
      clockIn: today,
    },
  });

  console.log('⏰ Created 3 time entries');

  // Create a weekly log
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

  await prisma.weeklyLog.create({
    data: {
      userId: becario1.id,
      weekStart,
      weekEnd,
      activities: 'Trabajé en el diseño de identidad visual para el evento de bienvenida. Realicé 3 propuestas de logo y seleccioné la paleta de colores.',
      achievements: 'Logré terminar los bocetos antes de la fecha límite.',
      challenges: 'Tuve dificultades para encontrar tipografías que combinaran bien con el estilo institucional.',
      learnings: 'Aprendí a usar nuevas herramientas de Adobe Illustrator para vectorización.',
      nextGoals: 'Finalizar los materiales gráficos y preparar la presentación al cliente.',
      totalHours: 12.5,
    },
  });

  console.log('📓 Created 1 weekly log');

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('   Admin: admin@pulso.edu.mx / password123');
  console.log('   Supervisor: supervisor@pulso.edu.mx / password123');
  console.log('   Becarios: juan@pulso.edu.mx, ana@pulso.edu.mx, pedro@pulso.edu.mx / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
