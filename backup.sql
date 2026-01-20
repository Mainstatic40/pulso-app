--
-- PostgreSQL database dump
--

\restrict AqPAdepUTCdxLCNSzRGckad8nbGDvr8QYdEwvlqGvd04IMDh6gwl4aL1oIec9zE

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EquipmentCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EquipmentCategory" AS ENUM (
    'camera',
    'lens',
    'adapter',
    'sd_card'
);


ALTER TYPE public."EquipmentCategory" OWNER TO postgres;

--
-- Name: EquipmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EquipmentStatus" AS ENUM (
    'available',
    'in_use',
    'maintenance'
);


ALTER TYPE public."EquipmentStatus" OWNER TO postgres;

--
-- Name: EventType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EventType" AS ENUM (
    'civic',
    'church',
    'yearbook',
    'congress'
);


ALTER TYPE public."EventType" OWNER TO postgres;

--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'high',
    'medium',
    'low'
);


ALTER TYPE public."TaskPriority" OWNER TO postgres;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'pending',
    'in_progress',
    'review',
    'completed'
);


ALTER TYPE public."TaskStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'admin',
    'supervisor',
    'becario'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attachments (
    id text NOT NULL,
    filename character varying(255) NOT NULL,
    stored_name character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    size integer NOT NULL,
    task_id text,
    event_id text,
    uploaded_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.attachments OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id text NOT NULL,
    task_id text,
    user_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    event_id text
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation_participants (
    conversation_id text NOT NULL,
    user_id text NOT NULL,
    joined_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_read_at timestamp(3) without time zone
);


ALTER TABLE public.conversation_participants OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    name character varying(100),
    is_group boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: equipment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment (
    id text NOT NULL,
    name character varying(200) NOT NULL,
    category public."EquipmentCategory" NOT NULL,
    status public."EquipmentStatus" DEFAULT 'available'::public."EquipmentStatus" NOT NULL,
    description text,
    serial_number character varying(100),
    rfid_tag character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.equipment OWNER TO postgres;

--
-- Name: equipment_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment_assignments (
    id text NOT NULL,
    equipment_id text NOT NULL,
    user_id text NOT NULL,
    event_id text,
    event_shift_id text,
    start_time timestamp(3) without time zone NOT NULL,
    end_time timestamp(3) without time zone,
    notes text,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.equipment_assignments OWNER TO postgres;

--
-- Name: equipment_usage_log_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment_usage_log_items (
    id text NOT NULL,
    log_id text NOT NULL,
    equipment_id text NOT NULL
);


ALTER TABLE public.equipment_usage_log_items OWNER TO postgres;

--
-- Name: equipment_usage_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment_usage_logs (
    id text NOT NULL,
    user_id text NOT NULL,
    logged_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.equipment_usage_logs OWNER TO postgres;

--
-- Name: event_assignees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_assignees (
    event_id text NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public.event_assignees OWNER TO postgres;

--
-- Name: event_checklist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_checklist_items (
    id text NOT NULL,
    event_id text NOT NULL,
    content character varying(500) NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.event_checklist_items OWNER TO postgres;

--
-- Name: event_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_days (
    id text NOT NULL,
    event_id text NOT NULL,
    date date NOT NULL,
    note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.event_days OWNER TO postgres;

--
-- Name: event_request_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_request_config (
    id text NOT NULL,
    access_code character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    rate_limit integer DEFAULT 5 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.event_request_config OWNER TO postgres;

--
-- Name: event_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_requests (
    id text NOT NULL,
    code character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    tipo_organizacion character varying(20) NOT NULL,
    facultad character varying(50),
    facultad_carrera character varying(100),
    departamento_nombre character varying(200),
    solicitante_nombre character varying(200) NOT NULL,
    solicitante_cargo character varying(50) NOT NULL,
    solicitante_email character varying(200) NOT NULL,
    solicitante_telefono character varying(50) NOT NULL,
    evento_nombre character varying(300) NOT NULL,
    evento_tipo character varying(100) NOT NULL,
    evento_tipo_otro character varying(200),
    evento_fecha timestamp(3) without time zone NOT NULL,
    evento_hora_inicio character varying(10) NOT NULL,
    evento_hora_fin character varying(10) NOT NULL,
    evento_ubicacion character varying(300) NOT NULL,
    evento_asistentes integer,
    servicio_fotografia boolean DEFAULT false NOT NULL,
    servicio_video boolean DEFAULT false NOT NULL,
    descripcion text,
    requerimientos_especiales text,
    notas_internas text,
    mensaje_solicitante text,
    event_id text,
    ip_address character varying(50),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    responded_at timestamp(3) without time zone,
    responded_by text
);


ALTER TABLE public.event_requests OWNER TO postgres;

--
-- Name: event_shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_shifts (
    id text NOT NULL,
    event_day_id text NOT NULL,
    user_id text NOT NULL,
    start_time character varying(5) NOT NULL,
    end_time character varying(5) NOT NULL,
    shift_type character varying(20),
    note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.event_shifts OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id text NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    client_requirements text,
    event_type public."EventType" NOT NULL,
    start_datetime timestamp(3) without time zone NOT NULL,
    end_datetime timestamp(3) without time zone NOT NULL,
    morning_start_time character varying(5),
    morning_end_time character varying(5),
    afternoon_start_time character varying(5),
    afternoon_end_time character varying(5),
    use_preset_equipment boolean DEFAULT false NOT NULL,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id text NOT NULL,
    conversation_id text NOT NULL,
    sender_id text NOT NULL,
    content text NOT NULL,
    attachment_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: monthly_hours_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monthly_hours_config (
    id text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    target_hours numeric(5,2) NOT NULL,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    hours_per_day numeric(4,2) DEFAULT 4 NOT NULL,
    start_date date
);


ALTER TABLE public.monthly_hours_config OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    link character varying(255),
    is_read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: pending_rfids; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_rfids (
    id text NOT NULL,
    rfid_tag character varying(50) NOT NULL,
    scanned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note character varying(255)
);


ALTER TABLE public.pending_rfids OWNER TO postgres;

--
-- Name: solicitor_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitor_tokens (
    id text NOT NULL,
    email text NOT NULL,
    token character varying(50) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.solicitor_tokens OWNER TO postgres;

--
-- Name: task_assignees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_assignees (
    task_id text NOT NULL,
    user_id text NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_assignees OWNER TO postgres;

--
-- Name: task_checklist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_checklist_items (
    id text NOT NULL,
    task_id text NOT NULL,
    content character varying(500) NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.task_checklist_items OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    client_requirements text,
    status public."TaskStatus" DEFAULT 'pending'::public."TaskStatus" NOT NULL,
    priority public."TaskPriority" DEFAULT 'medium'::public."TaskPriority" NOT NULL,
    due_date date NOT NULL,
    execution_date date,
    shift character varying(20),
    morning_start_time character varying(5),
    morning_end_time character varying(5),
    afternoon_start_time character varying(5),
    afternoon_end_time character varying(5),
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_entries (
    id text NOT NULL,
    user_id text NOT NULL,
    event_id text,
    clock_in timestamp(3) without time zone NOT NULL,
    clock_out timestamp(3) without time zone,
    total_hours numeric(5,2),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.time_entries OWNER TO postgres;

--
-- Name: token_recovery_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_recovery_requests (
    id text NOT NULL,
    email character varying(200) NOT NULL,
    token character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_at timestamp(3) without time zone
);


ALTER TABLE public.token_recovery_requests OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rfid_tag character varying(50),
    profile_image character varying(255),
    role public."UserRole" DEFAULT 'becario'::public."UserRole" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: weekly_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weekly_logs (
    id text NOT NULL,
    user_id text NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    activities text NOT NULL,
    achievements text,
    challenges text,
    learnings text,
    next_goals text,
    total_hours numeric(5,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.weekly_logs OWNER TO postgres;

--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attachments (id, filename, stored_name, mime_type, size, task_id, event_id, uploaded_by, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, task_id, user_id, content, created_at, event_id) FROM stdin;
b8d55a13-6b7b-48e8-a95d-f7076be45981	e67f4631-b680-431c-b4de-6c4455140eb7	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	La mara quedo Feliz sin arrugas. 	2026-01-13 18:45:18.299	\N
185a2a41-4862-4f19-897a-35522de52eb0	e67f4631-b680-431c-b4de-6c4455140eb7	0c11645d-89dc-441e-a1c8-270d7999255f	Okay\n	2026-01-13 18:45:28.2	\N
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversation_participants (conversation_id, user_id, joined_at, last_read_at) FROM stdin;
461a42c6-e027-487a-aef1-36b6e8c75bbe	0c11645d-89dc-441e-a1c8-270d7999255f	2026-01-13 19:47:43.239	2026-01-14 16:47:38.423
461a42c6-e027-487a-aef1-36b6e8c75bbe	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:47:43.239	2026-01-15 03:01:14.241
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, name, is_group, created_at, updated_at) FROM stdin;
461a42c6-e027-487a-aef1-36b6e8c75bbe	\N	f	2026-01-13 19:47:43.239	2026-01-15 02:35:23.207
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment (id, name, category, status, description, serial_number, rfid_tag, is_active, created_at, updated_at) FROM stdin;
64b5e666-a1cf-4cfb-b935-d61fd43e117e	Sigma 24-70mm	lens	available	\N	\N	\N	t	2026-01-13 18:33:55.263	2026-01-13 18:33:55.263
ac075d83-2e1c-4b71-bb8d-b9e26ebb4202	Canon R	camera	available	\N	\N	\N	t	2026-01-13 19:02:13.238	2026-01-13 19:02:13.238
5c2296ac-2027-4e0b-9b73-9bd891afaa46	Adaptador 2	adapter	available	\N	\N	\N	t	2026-01-13 19:02:17.83	2026-01-13 19:02:43.674
3a8e7e40-4f96-427e-86bf-2404d231659f	Lexar 256gb	sd_card	available	\N	\N	\N	t	2026-01-13 19:03:38.97	2026-01-13 19:03:38.97
e9c5c3c1-bb09-43ab-81ba-b84efdec64d6	Sigma 70-200mm f/2.8	lens	available	\N	\N	\N	t	2026-01-13 19:04:23.133	2026-01-13 19:05:25.679
d0ba7e13-d7f3-4b90-a570-4d3fd0fdf5c5	Canon RP	camera	available	\N	\N	\N	t	2026-01-13 19:38:46.18	2026-01-13 19:39:26.703
464d3e4d-85e0-477f-b7b3-5c2badeeff1b	Canon R5	camera	available	\N	\N	\N	t	2026-01-13 18:32:45.795	2026-01-14 00:48:37.235
5a609b23-33c7-40c5-8637-aaefaeb92ec4	Adaptador 1	adapter	available	\N	\N	\N	t	2026-01-13 18:33:22.027	2026-01-14 00:48:37.235
15fd626a-2e75-41b2-b8fc-091cac6d7dfa	Lexar 128gb	sd_card	available	\N	\N	\N	t	2026-01-13 18:33:42.609	2026-01-14 00:48:37.235
f0034883-91a2-4294-98c6-8e32d5bb3691	Canon 16-35mm f/2.8	lens	available	\N	\N	\N	t	2026-01-13 19:02:36.218	2026-01-14 00:48:37.235
b6634063-1a79-40f8-b1f7-909786512f1f	64 JH	sd_card	available	\N	JH	\N	t	2026-01-15 03:20:06.033	2026-01-15 03:20:06.033
\.


--
-- Data for Name: equipment_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment_assignments (id, equipment_id, user_id, event_id, event_shift_id, start_time, end_time, notes, created_by, created_at) FROM stdin;
c4968feb-303b-4dc4-a662-080e2b5672a7	464d3e4d-85e0-477f-b7b3-5c2badeeff1b	0c11645d-89dc-441e-a1c8-270d7999255f	34b5399d-131e-4031-8d95-1899eba63a01	0efb2084-1dd3-4e61-a7c8-0e2b5efe7d43	2026-02-14 01:00:00	2026-02-14 03:00:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.305
a054c9a5-a8c9-416c-a57e-9581a0012fef	e9c5c3c1-bb09-43ab-81ba-b84efdec64d6	0c11645d-89dc-441e-a1c8-270d7999255f	34b5399d-131e-4031-8d95-1899eba63a01	0efb2084-1dd3-4e61-a7c8-0e2b5efe7d43	2026-02-14 01:00:00	2026-02-14 03:00:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.305
63f2b5b1-d352-404e-a0f2-33f8bba5875f	5a609b23-33c7-40c5-8637-aaefaeb92ec4	0c11645d-89dc-441e-a1c8-270d7999255f	34b5399d-131e-4031-8d95-1899eba63a01	0efb2084-1dd3-4e61-a7c8-0e2b5efe7d43	2026-02-14 01:00:00	2026-02-14 03:00:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.305
6cbeddbe-e48e-4203-85bc-c4012e8d582d	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	0c11645d-89dc-441e-a1c8-270d7999255f	34b5399d-131e-4031-8d95-1899eba63a01	0efb2084-1dd3-4e61-a7c8-0e2b5efe7d43	2026-02-14 01:00:00	2026-02-14 03:00:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.305
74b72131-b59b-4dbb-9cf0-a05d3b019275	464d3e4d-85e0-477f-b7b3-5c2badeeff1b	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	34b5399d-131e-4031-8d95-1899eba63a01	cfa1ef66-a70d-442e-8007-1335392e0f15	2026-02-14 15:00:00	2026-02-14 16:30:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.311
0f00f44f-3442-478c-94f7-6a52f4c5dd2f	e9c5c3c1-bb09-43ab-81ba-b84efdec64d6	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	34b5399d-131e-4031-8d95-1899eba63a01	cfa1ef66-a70d-442e-8007-1335392e0f15	2026-02-14 15:00:00	2026-02-14 16:30:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.311
960b635b-0d1a-465e-8d6c-99b738177125	5a609b23-33c7-40c5-8637-aaefaeb92ec4	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	34b5399d-131e-4031-8d95-1899eba63a01	cfa1ef66-a70d-442e-8007-1335392e0f15	2026-02-14 15:00:00	2026-02-14 16:30:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.311
27d49588-51ff-4820-b265-aab118c56b5c	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	34b5399d-131e-4031-8d95-1899eba63a01	cfa1ef66-a70d-442e-8007-1335392e0f15	2026-02-14 15:00:00	2026-02-14 16:30:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.311
a7a35777-5362-41ac-95e3-4853143862be	464d3e4d-85e0-477f-b7b3-5c2badeeff1b	935f08e0-03bd-4828-8603-3d0f6d08499a	34b5399d-131e-4031-8d95-1899eba63a01	c09597a3-045a-4ba7-9357-771d4adf197d	2026-02-14 16:30:00	2026-02-14 19:00:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.315
fa3c1d54-e79f-424a-8648-433f81b3178e	e9c5c3c1-bb09-43ab-81ba-b84efdec64d6	935f08e0-03bd-4828-8603-3d0f6d08499a	34b5399d-131e-4031-8d95-1899eba63a01	c09597a3-045a-4ba7-9357-771d4adf197d	2026-02-14 16:30:00	2026-02-14 19:00:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.315
cf179af1-2763-43c6-a834-f6013c54c2d4	5a609b23-33c7-40c5-8637-aaefaeb92ec4	935f08e0-03bd-4828-8603-3d0f6d08499a	34b5399d-131e-4031-8d95-1899eba63a01	c09597a3-045a-4ba7-9357-771d4adf197d	2026-02-14 16:30:00	2026-02-14 19:00:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.315
0e02101f-2040-4d00-abf2-b7aea66e15af	3a8e7e40-4f96-427e-86bf-2404d231659f	935f08e0-03bd-4828-8603-3d0f6d08499a	34b5399d-131e-4031-8d95-1899eba63a01	c09597a3-045a-4ba7-9357-771d4adf197d	2026-02-14 16:30:00	2026-02-14 19:00:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.315
ce8f13ec-c8bb-4ecb-8d8c-744101e34d89	464d3e4d-85e0-477f-b7b3-5c2badeeff1b	bb5578ba-07aa-46b5-be23-99f71446fab5	34b5399d-131e-4031-8d95-1899eba63a01	08fee96e-3188-487e-81a1-48990fb78d14	2026-02-14 23:30:00	2026-02-15 01:30:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.319
4adc1b08-efac-4b8c-8a08-81ae1b547730	64b5e666-a1cf-4cfb-b935-d61fd43e117e	bb5578ba-07aa-46b5-be23-99f71446fab5	34b5399d-131e-4031-8d95-1899eba63a01	08fee96e-3188-487e-81a1-48990fb78d14	2026-02-14 23:30:00	2026-02-15 01:30:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.319
a2845208-a025-4c09-914d-ce753bd28fb6	5a609b23-33c7-40c5-8637-aaefaeb92ec4	bb5578ba-07aa-46b5-be23-99f71446fab5	34b5399d-131e-4031-8d95-1899eba63a01	08fee96e-3188-487e-81a1-48990fb78d14	2026-02-14 23:30:00	2026-02-15 01:30:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.319
6956a9c9-ecc9-4524-ab58-a990eede7ac1	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	bb5578ba-07aa-46b5-be23-99f71446fab5	34b5399d-131e-4031-8d95-1899eba63a01	08fee96e-3188-487e-81a1-48990fb78d14	2026-02-14 23:30:00	2026-02-15 01:30:00	Evento: Congreso de Creación Biblica (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.319
b311a4eb-7a95-4b17-bc80-8b66a7187cde	ac075d83-2e1c-4b71-bb8d-b9e26ebb4202	0c11645d-89dc-441e-a1c8-270d7999255f	1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	a5d11eb4-aa53-4248-acab-500712b21459	2026-01-28 14:00:00	2026-01-28 17:00:00	Evento: Fotos de Graduandos Terapia Fisica (morning)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:29:38.271
4e3c7791-21ff-4a18-870f-c85bf27318eb	64b5e666-a1cf-4cfb-b935-d61fd43e117e	0c11645d-89dc-441e-a1c8-270d7999255f	1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	a5d11eb4-aa53-4248-acab-500712b21459	2026-01-28 14:00:00	2026-01-28 17:00:00	Evento: Fotos de Graduandos Terapia Fisica (morning)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:29:38.271
96accf20-caf6-4c03-a12b-40e28f9addd1	5a609b23-33c7-40c5-8637-aaefaeb92ec4	0c11645d-89dc-441e-a1c8-270d7999255f	1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	a5d11eb4-aa53-4248-acab-500712b21459	2026-01-28 14:00:00	2026-01-28 17:00:00	Evento: Fotos de Graduandos Terapia Fisica (morning)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:29:38.271
879c1238-bf2f-4ebe-a645-30afd5ddbba1	ac075d83-2e1c-4b71-bb8d-b9e26ebb4202	935f08e0-03bd-4828-8603-3d0f6d08499a	1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	083d3bdd-f879-47bd-91d7-c91d6cb1121c	2026-01-28 20:30:00	2026-01-28 23:30:00	Evento: Fotos de Graduandos Terapia Fisica (afternoon)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:29:38.275
1db36537-262d-4aae-a27b-69bce02b12d7	64b5e666-a1cf-4cfb-b935-d61fd43e117e	935f08e0-03bd-4828-8603-3d0f6d08499a	1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	083d3bdd-f879-47bd-91d7-c91d6cb1121c	2026-01-28 20:30:00	2026-01-28 23:30:00	Evento: Fotos de Graduandos Terapia Fisica (afternoon)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:29:38.275
4809e0af-27c5-4900-8235-808ce645f756	5a609b23-33c7-40c5-8637-aaefaeb92ec4	935f08e0-03bd-4828-8603-3d0f6d08499a	1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	083d3bdd-f879-47bd-91d7-c91d6cb1121c	2026-01-28 20:30:00	2026-01-28 23:30:00	Evento: Fotos de Graduandos Terapia Fisica (afternoon)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:29:38.275
bcbd354b-4bf2-4281-a74a-99c6133f65c5	464d3e4d-85e0-477f-b7b3-5c2badeeff1b	0c11645d-89dc-441e-a1c8-270d7999255f	24d7c86d-bffd-4396-8920-3d1da6a49158	c0ec1d7a-2242-4857-bfec-00f06bd52731	2026-01-13 19:00:00	2026-01-13 23:00:00	Evento: Matricula Prioritaria (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:34:47.185
4ec7080b-a620-462c-86a3-21ec30934081	f0034883-91a2-4294-98c6-8e32d5bb3691	0c11645d-89dc-441e-a1c8-270d7999255f	24d7c86d-bffd-4396-8920-3d1da6a49158	c0ec1d7a-2242-4857-bfec-00f06bd52731	2026-01-13 19:00:00	2026-01-13 23:00:00	Evento: Matricula Prioritaria (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:34:47.185
2116e0e9-c8e1-42e8-8ed2-f395ee79ce4d	5a609b23-33c7-40c5-8637-aaefaeb92ec4	0c11645d-89dc-441e-a1c8-270d7999255f	24d7c86d-bffd-4396-8920-3d1da6a49158	c0ec1d7a-2242-4857-bfec-00f06bd52731	2026-01-13 19:00:00	2026-01-13 23:00:00	Evento: Matricula Prioritaria (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:34:47.185
2bbdfa39-170e-4f66-b666-fa5d4093b21a	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	0c11645d-89dc-441e-a1c8-270d7999255f	24d7c86d-bffd-4396-8920-3d1da6a49158	c0ec1d7a-2242-4857-bfec-00f06bd52731	2026-01-13 19:00:00	2026-01-13 23:00:00	Evento: Matricula Prioritaria (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:34:47.185
58156314-ee5b-4bbf-b54e-104b48965b01	ac075d83-2e1c-4b71-bb8d-b9e26ebb4202	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	\N	\N	2026-01-29 14:00:00	2026-01-29 18:00:00	Tarea: Fotografía (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 02:58:28.203
b7762314-e7a3-4a35-a523-ffac5138f17d	64b5e666-a1cf-4cfb-b935-d61fd43e117e	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	\N	\N	2026-01-29 14:00:00	2026-01-29 18:00:00	Tarea: Fotografía (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 02:58:28.203
d6a4c51d-6ad2-43b5-a99c-39655af1cff5	5a609b23-33c7-40c5-8637-aaefaeb92ec4	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	\N	\N	2026-01-29 14:00:00	2026-01-29 18:00:00	Tarea: Fotografía (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 02:58:28.203
153e3168-f8d7-4474-b576-4cb8248bc754	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	\N	\N	2026-01-29 14:00:00	2026-01-29 18:00:00	Tarea: Fotografía (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 02:58:28.203
067a2b7d-ed59-4719-9950-bad1077f8b9e	ac075d83-2e1c-4b71-bb8d-b9e26ebb4202	935f08e0-03bd-4828-8603-3d0f6d08499a	\N	\N	2026-01-16 16:00:00	2026-01-16 16:40:00	Tarea: Foto de cierre de Matricula (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 02:57:56.258
864fe9a5-0d78-423c-b789-dbb3714f97ce	f0034883-91a2-4294-98c6-8e32d5bb3691	935f08e0-03bd-4828-8603-3d0f6d08499a	\N	\N	2026-01-16 16:00:00	2026-01-16 16:40:00	Tarea: Foto de cierre de Matricula (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 02:57:56.258
0addd46a-47a5-43a9-b8c4-ee3a54294c5f	ac075d83-2e1c-4b71-bb8d-b9e26ebb4202	0c11645d-89dc-441e-a1c8-270d7999255f	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	cb914e20-0a6b-407c-a908-c12c013786f6	2026-01-20 14:00:00	2026-01-20 14:30:00	Evento: Inauguración del Curso Primavera 2026 (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 04:35:21.822
6a2d8024-a012-4330-9e12-1c2297f2984c	e9c5c3c1-bb09-43ab-81ba-b84efdec64d6	0c11645d-89dc-441e-a1c8-270d7999255f	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	cb914e20-0a6b-407c-a908-c12c013786f6	2026-01-20 14:00:00	2026-01-20 14:30:00	Evento: Inauguración del Curso Primavera 2026 (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 04:35:21.822
ef2deba1-8507-403c-802d-4d8b4acf1341	5a609b23-33c7-40c5-8637-aaefaeb92ec4	0c11645d-89dc-441e-a1c8-270d7999255f	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	cb914e20-0a6b-407c-a908-c12c013786f6	2026-01-20 14:00:00	2026-01-20 14:30:00	Evento: Inauguración del Curso Primavera 2026 (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 04:35:21.822
b0c6dbdd-deaf-48d2-bc95-dc07c2196292	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	0c11645d-89dc-441e-a1c8-270d7999255f	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	cb914e20-0a6b-407c-a908-c12c013786f6	2026-01-20 14:00:00	2026-01-20 14:30:00	Evento: Inauguración del Curso Primavera 2026 (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 04:35:21.822
fb30585e-e672-487d-b9e0-23b500f2230b	464d3e4d-85e0-477f-b7b3-5c2badeeff1b	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	e6001eba-f9b7-45cc-9a68-62e230eeaec3	2026-01-20 14:30:00	2026-01-20 15:00:00	Evento: Inauguración del Curso Primavera 2026 (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 04:35:21.826
d6a67f78-de75-4604-90c2-c400704fc774	e9c5c3c1-bb09-43ab-81ba-b84efdec64d6	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	e6001eba-f9b7-45cc-9a68-62e230eeaec3	2026-01-20 14:30:00	2026-01-20 15:00:00	Evento: Inauguración del Curso Primavera 2026 (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 04:35:21.826
000d883c-8a61-4b8e-9726-4fd076cd07dc	5a609b23-33c7-40c5-8637-aaefaeb92ec4	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	e6001eba-f9b7-45cc-9a68-62e230eeaec3	2026-01-20 14:30:00	2026-01-20 15:00:00	Evento: Inauguración del Curso Primavera 2026 (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 04:35:21.826
10822d76-d9a4-4892-8946-595104034e15	3a8e7e40-4f96-427e-86bf-2404d231659f	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	e6001eba-f9b7-45cc-9a68-62e230eeaec3	2026-01-20 14:30:00	2026-01-20 15:00:00	Evento: Inauguración del Curso Primavera 2026 (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 04:35:21.826
fbc3329d-7da5-4db2-8869-19b9ab237122	ac075d83-2e1c-4b71-bb8d-b9e26ebb4202	99e80949-ce36-43e9-8e1b-2a1cee0472a9	5e75e1e9-74e5-4fa2-87c7-953ea8cf9a58	7bf25949-912a-4053-9d75-fe51151b5566	2026-01-31 15:00:00	2026-01-31 19:00:00	Evento: Juego de ajedrez (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 05:03:08.469
13abfe0a-62e5-4bfc-a6ff-fabee313291f	64b5e666-a1cf-4cfb-b935-d61fd43e117e	99e80949-ce36-43e9-8e1b-2a1cee0472a9	5e75e1e9-74e5-4fa2-87c7-953ea8cf9a58	7bf25949-912a-4053-9d75-fe51151b5566	2026-01-31 15:00:00	2026-01-31 19:00:00	Evento: Juego de ajedrez (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 05:03:08.469
58ea999b-b7a0-4ab8-812d-c9a6964cd9dd	5a609b23-33c7-40c5-8637-aaefaeb92ec4	99e80949-ce36-43e9-8e1b-2a1cee0472a9	5e75e1e9-74e5-4fa2-87c7-953ea8cf9a58	7bf25949-912a-4053-9d75-fe51151b5566	2026-01-31 15:00:00	2026-01-31 19:00:00	Evento: Juego de ajedrez (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 05:03:08.469
76de8779-9309-40e0-8607-8d9e855b2a89	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	99e80949-ce36-43e9-8e1b-2a1cee0472a9	5e75e1e9-74e5-4fa2-87c7-953ea8cf9a58	7bf25949-912a-4053-9d75-fe51151b5566	2026-01-31 15:00:00	2026-01-31 19:00:00	Evento: Juego de ajedrez (Turno)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 05:03:08.469
7c710475-4c66-4ec0-a99b-afc149ff8db3	5a609b23-33c7-40c5-8637-aaefaeb92ec4	935f08e0-03bd-4828-8603-3d0f6d08499a	\N	\N	2026-01-16 16:00:00	2026-01-16 16:40:00	Tarea: Foto de cierre de Matricula (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 02:57:56.258
c3b90d00-cbd8-4062-8ac5-6a07d9f5c9c5	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	935f08e0-03bd-4828-8603-3d0f6d08499a	\N	\N	2026-01-16 16:00:00	2026-01-16 16:40:00	Tarea: Foto de cierre de Matricula (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 02:57:56.258
2477e1cb-da97-4409-989d-46cca7fec3d5	464d3e4d-85e0-477f-b7b3-5c2badeeff1b	5e193bad-0fbd-46aa-b6da-c67f168be207	\N	\N	2026-01-14 15:00:00	2026-01-14 16:00:00	Tarea: Fotos Inscripción  (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-15 03:19:25.104
d4920330-2db8-4ff6-b14b-1be1af005e0c	64b5e666-a1cf-4cfb-b935-d61fd43e117e	5e193bad-0fbd-46aa-b6da-c67f168be207	\N	\N	2026-01-14 15:00:00	2026-01-14 16:00:00	Tarea: Fotos Inscripción  (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-15 03:19:25.104
e6956f76-de10-4952-9210-fafcbfe6a224	5a609b23-33c7-40c5-8637-aaefaeb92ec4	5e193bad-0fbd-46aa-b6da-c67f168be207	\N	\N	2026-01-14 15:00:00	2026-01-14 16:00:00	Tarea: Fotos Inscripción  (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-15 03:19:25.104
a983f313-9287-4928-80a0-7d45c039c23b	15fd626a-2e75-41b2-b8fc-091cac6d7dfa	5e193bad-0fbd-46aa-b6da-c67f168be207	\N	\N	2026-01-14 15:00:00	2026-01-14 16:00:00	Tarea: Fotos Inscripción  (Mañana)	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-15 03:19:25.104
\.


--
-- Data for Name: equipment_usage_log_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment_usage_log_items (id, log_id, equipment_id) FROM stdin;
\.


--
-- Data for Name: equipment_usage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment_usage_logs (id, user_id, logged_at) FROM stdin;
\.


--
-- Data for Name: event_assignees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_assignees (event_id, user_id) FROM stdin;
\.


--
-- Data for Name: event_checklist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_checklist_items (id, event_id, content, is_completed, "order", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_days; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_days (id, event_id, date, note, created_at, updated_at) FROM stdin;
4a40be63-0f4c-44ef-bbd4-2bc39ed4456b	34b5399d-131e-4031-8d95-1899eba63a01	2026-02-13	\N	2026-01-13 19:20:52.3	2026-01-13 19:20:52.3
ec0a9118-db55-4c9b-a147-5046a81336b1	34b5399d-131e-4031-8d95-1899eba63a01	2026-02-14	\N	2026-01-13 19:20:52.308	2026-01-13 19:20:52.308
008fde3c-e61b-4e1a-9aef-847f636dcf35	1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	2026-01-28	\N	2026-01-13 19:29:38.265	2026-01-13 19:29:38.265
4b86bfee-1542-4c27-b4e4-e613304d08b3	24d7c86d-bffd-4396-8920-3d1da6a49158	2026-01-12	\N	2026-01-13 19:34:47.177	2026-01-13 19:34:47.177
ca2a507c-d9e6-41e5-b000-5393f085d18e	24d7c86d-bffd-4396-8920-3d1da6a49158	2026-01-13	\N	2026-01-13 19:34:47.18	2026-01-13 19:34:47.18
2ccbf63a-c821-4b7a-ae87-8cba855299a7	24d7c86d-bffd-4396-8920-3d1da6a49158	2026-01-14	\N	2026-01-13 19:34:47.188	2026-01-13 19:34:47.188
a06fe6db-e8fc-4de6-965e-a1edb61d3e6a	24d7c86d-bffd-4396-8920-3d1da6a49158	2026-01-15	\N	2026-01-13 19:34:47.19	2026-01-13 19:34:47.19
cc4439cf-5ed6-4c62-8673-ed0c9921cdde	24d7c86d-bffd-4396-8920-3d1da6a49158	2026-01-16	\N	2026-01-13 19:34:47.191	2026-01-13 19:34:47.191
65ae74c2-733c-4eb7-b1e4-054a18808fe2	3a1b39da-ed47-4a32-85bc-bbaf02f4643e	2026-01-20	\N	2026-01-14 04:35:21.818	2026-01-14 04:35:21.818
6c99f182-1a8e-4d23-9b84-340e3befdcda	5e75e1e9-74e5-4fa2-87c7-953ea8cf9a58	2026-01-31	\N	2026-01-14 05:03:08.466	2026-01-14 05:03:08.466
54da2a8b-9319-4a19-91ac-ff6196c6acb5	ac0b4a60-7b57-4473-be33-b5b64b942187	2026-01-11	\N	2026-01-14 14:53:23.165	2026-01-14 14:53:23.165
\.


--
-- Data for Name: event_request_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_request_config (id, access_code, is_active, rate_limit, created_at, updated_at) FROM stdin;
4068dd1c-247d-45dc-8ed3-f59bc3777b61	MULTIMEDIA2026	t	5	2026-01-08 20:42:40.851	2026-01-08 20:42:40.851
\.


--
-- Data for Name: event_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_requests (id, code, status, tipo_organizacion, facultad, facultad_carrera, departamento_nombre, solicitante_nombre, solicitante_cargo, solicitante_email, solicitante_telefono, evento_nombre, evento_tipo, evento_tipo_otro, evento_fecha, evento_hora_inicio, evento_hora_fin, evento_ubicacion, evento_asistentes, servicio_fotografia, servicio_video, descripcion, requerimientos_especiales, notas_internas, mensaje_solicitante, event_id, ip_address, created_at, updated_at, responded_at, responded_by) FROM stdin;
e21ff28c-44a3-4ff8-b456-7793b37edc10	SOL-2026-62333	approved	facultad	FITEC			Daniel Gutierre	director	christophercastellanos2004@gmail.com	984314578	Juego de ajedrez	otro	Juego de ajedrez	2026-01-31 00:00:00	16:00	18:30	Faculta de ingeniería	50	t	f	Pueden tomar fotos en el evento del concurso de ajedrez			Claro ahi estaremos, hay refrigério?	5e75e1e9-74e5-4fa2-87c7-953ea8cf9a58	189.175.148.115	2026-01-13 20:13:17.101	2026-01-13 20:15:05.944	2026-01-13 20:15:05.943	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee
1c26f961-6899-4405-ab64-9eae0a4d9406	SOL-2026-69404	approved	facultad	FACSA	nutricion		Christopher	director	christophercastellanos2004@gmail.com	984314578	Juego de ajedrez 2	conferencia		2026-01-30 00:00:00	10:04	15:04	Faculta de ingeniería	4	t	f	de	de			a72b663a-e47b-4702-a2aa-0f780410bed7	189.175.197.40	2026-01-15 16:04:37.541	2026-01-15 16:05:18.659	2026-01-15 16:05:18.658	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee
\.


--
-- Data for Name: event_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_shifts (id, event_day_id, user_id, start_time, end_time, shift_type, note, created_at) FROM stdin;
0efb2084-1dd3-4e61-a7c8-0e2b5efe7d43	4a40be63-0f4c-44ef-bbd4-2bc39ed4456b	0c11645d-89dc-441e-a1c8-270d7999255f	19:00	21:00	\N	\N	2026-01-13 19:20:52.303
cfa1ef66-a70d-442e-8007-1335392e0f15	ec0a9118-db55-4c9b-a147-5046a81336b1	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	09:00	10:30	\N	\N	2026-01-13 19:20:52.309
c09597a3-045a-4ba7-9357-771d4adf197d	ec0a9118-db55-4c9b-a147-5046a81336b1	935f08e0-03bd-4828-8603-3d0f6d08499a	10:30	13:00	\N	\N	2026-01-13 19:20:52.313
08fee96e-3188-487e-81a1-48990fb78d14	ec0a9118-db55-4c9b-a147-5046a81336b1	bb5578ba-07aa-46b5-be23-99f71446fab5	17:30	19:30	\N	Pedir llaves a Atzin, tomar fotos de aricas y la herman bety oedio que le tomarás foto de la niña que tener el rincón infitnl ah pero no oviodalo. 	2026-01-13 19:20:52.317
a5d11eb4-aa53-4248-acab-500712b21459	008fde3c-e61b-4e1a-9aef-847f636dcf35	0c11645d-89dc-441e-a1c8-270d7999255f	08:00	11:00	morning	\N	2026-01-13 19:29:38.267
083d3bdd-f879-47bd-91d7-c91d6cb1121c	008fde3c-e61b-4e1a-9aef-847f636dcf35	935f08e0-03bd-4828-8603-3d0f6d08499a	14:30	17:30	afternoon	\N	2026-01-13 19:29:38.274
c0ec1d7a-2242-4857-bfec-00f06bd52731	ca2a507c-d9e6-41e5-b000-5393f085d18e	0c11645d-89dc-441e-a1c8-270d7999255f	13:00	17:00	\N	\N	2026-01-13 19:34:47.181
cb914e20-0a6b-407c-a908-c12c013786f6	65ae74c2-733c-4eb7-b1e4-054a18808fe2	0c11645d-89dc-441e-a1c8-270d7999255f	08:00	08:30	\N	Tomar al Rector con el 70-200	2026-01-14 04:35:21.82
e6001eba-f9b7-45cc-9a68-62e230eeaec3	65ae74c2-733c-4eb7-b1e4-054a18808fe2	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	08:30	09:00	\N	\N	2026-01-14 04:35:21.825
7bf25949-912a-4053-9d75-fe51151b5566	6c99f182-1a8e-4d23-9b84-340e3befdcda	99e80949-ce36-43e9-8e1b-2a1cee0472a9	09:00	13:00	\N	\N	2026-01-14 05:03:08.468
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, name, description, client_requirements, event_type, start_datetime, end_datetime, morning_start_time, morning_end_time, afternoon_start_time, afternoon_end_time, use_preset_equipment, created_by, created_at) FROM stdin;
34b5399d-131e-4031-8d95-1899eba63a01	Congreso de Creación Biblica		\N	church	2026-02-13 18:00:00	2026-02-14 18:00:00	\N	\N	\N	\N	f	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:20:52.296
1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	Fotos de Graduandos Terapia Fisica	Foto de con toga y todo el show en PULSO.	\N	yearbook	2026-01-28 18:00:00	2026-01-28 18:00:00	08:00	11:00	14:30	17:30	t	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:29:38.261
24d7c86d-bffd-4396-8920-3d1da6a49158	Matricula Prioritaria		\N	civic	2026-01-12 18:00:00	2026-01-16 18:00:00	\N	\N	\N	\N	f	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:34:47.173
3a1b39da-ed47-4a32-85bc-bbaf02f4643e	Inauguración del Curso Primavera 2026	Cubrimeinto del evento, recuerden que es la ultima del rector.	Fotos del Rector de todos los ángulos.	civic	2026-01-20 18:00:00	2026-01-20 18:00:00	\N	\N	\N	\N	f	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 19:08:03.652
5e75e1e9-74e5-4fa2-87c7-953ea8cf9a58	Juego de ajedrez	Pueden tomar fotos en el evento del concurso de ajedrez	\N	congress	2026-01-31 18:00:00	2026-01-31 18:00:00	\N	\N	\N	\N	f	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 20:15:05.938
ac0b4a60-7b57-4473-be33-b5b64b942187	qq	qwe	qwe	civic	2026-01-11 18:00:00	2026-01-11 18:00:00	\N	\N	\N	\N	f	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-14 03:51:28.157
a72b663a-e47b-4702-a2aa-0f780410bed7	Juego de ajedrez 2	de	de	congress	2026-01-30 00:00:00	2026-01-30 00:00:00	\N	\N	\N	\N	f	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-15 16:05:18.654
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_id, content, attachment_id, created_at, updated_at) FROM stdin;
d3796ea3-8f76-4d68-949a-b35aa7ee54bf	461a42c6-e027-487a-aef1-36b6e8c75bbe	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	Hola Chris	\N	2026-01-13 19:47:50.818	2026-01-13 19:47:50.818
01930068-3c65-4622-9431-d0e647cd31d0	461a42c6-e027-487a-aef1-36b6e8c75bbe	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	me parece buena idea lo del pago \\	\N	2026-01-13 19:48:00.151	2026-01-13 19:48:00.151
2126185d-32fb-47ff-9075-252c70c08333	461a42c6-e027-487a-aef1-36b6e8c75bbe	0c11645d-89dc-441e-a1c8-270d7999255f	A mi tambien	\N	2026-01-13 19:48:14.155	2026-01-13 19:48:14.155
37a2874a-b1c1-4245-bb61-f0b20875c5db	461a42c6-e027-487a-aef1-36b6e8c75bbe	0c11645d-89dc-441e-a1c8-270d7999255f	Hay que implementarlo	\N	2026-01-13 19:48:22.055	2026-01-13 19:48:22.055
e956842a-0896-409d-a1b7-540bb3d0c64b	461a42c6-e027-487a-aef1-36b6e8c75bbe	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	https://pulsoumedia.com/solicitar/MULTIMEDIA2026	\N	2026-01-13 20:10:36.446	2026-01-13 20:10:36.446
be5401be-7728-4cb2-8931-ee48d701a096	461a42c6-e027-487a-aef1-36b6e8c75bbe	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	Va	\N	2026-01-15 02:35:23.21	2026-01-15 02:35:23.21
\.


--
-- Data for Name: monthly_hours_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monthly_hours_config (id, year, month, target_hours, created_by, created_at, updated_at, hours_per_day, start_date) FROM stdin;
3419f256-a4c2-47e0-8068-789b92627378	2026	1	36.00	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 18:19:25.175	2026-01-14 22:34:01.164	4.00	2026-01-20
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, link, is_read, metadata, created_at) FROM stdin;
2c9402f7-3064-40de-aa0f-614f7d2a31d7	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Recorte de Fotos Graduandos FACEJ"	/tasks?open=958ac292-dd6d-47d8-8975-0ee664ca953d	f	{"taskId": "958ac292-dd6d-47d8-8975-0ee664ca953d"}	2026-01-13 18:31:03.426
871b087a-fdbf-40f0-9b45-f3d4448e3665	99e80949-ce36-43e9-8e1b-2a1cee0472a9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-13 18:36:00.095
9e3ce016-dded-4523-acca-982d1396ed67	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-13 18:40:45.385
3ca74eea-ecd6-4743-b583-3471b7ec92a0	0c11645d-89dc-441e-a1c8-270d7999255f	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Enviar foto de Credencial"	/tasks?open=e67f4631-b680-431c-b4de-6c4455140eb7	t	{"taskId": "e67f4631-b680-431c-b4de-6c4455140eb7"}	2026-01-13 18:33:01.291
f541dd31-3916-40f6-9b42-081aa8470713	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	task_comment	Nuevo comentario	Christopher Castellanos comentó en "Enviar foto de Credencial"	/tasks?open=e67f4631-b680-431c-b4de-6c4455140eb7	t	{"taskId": "e67f4631-b680-431c-b4de-6c4455140eb7", "commentId": "185a2a41-4862-4f19-897a-35522de52eb0"}	2026-01-13 18:45:28.204
cbb7cbb3-07dc-4bfc-b318-847510744643	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	task_review	Tarea lista para revisión	La tarea "Enviar foto de Credencial" está lista para revisar	/tasks?open=e67f4631-b680-431c-b4de-6c4455140eb7	t	{"taskId": "e67f4631-b680-431c-b4de-6c4455140eb7"}	2026-01-13 18:44:28.916
32851ba4-1322-4a30-922d-5f3bb912affb	0c11645d-89dc-441e-a1c8-270d7999255f	task_comment	Nuevo comentario	Jhoan Rueda comentó en "Enviar foto de Credencial"	/tasks?open=e67f4631-b680-431c-b4de-6c4455140eb7	t	{"taskId": "e67f4631-b680-431c-b4de-6c4455140eb7", "commentId": "b8d55a13-6b7b-48e8-a95d-f7076be45981"}	2026-01-13 18:45:18.305
4a4500e5-8074-4749-98b6-91118a601afe	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	event_assigned	Asignado a evento	Fuiste asignado al evento "Inauguración del Curso Primavera 2026"	/events?open=3a1b39da-ed47-4a32-85bc-bbaf02f4643e	f	{"eventId": "3a1b39da-ed47-4a32-85bc-bbaf02f4643e"}	2026-01-13 19:08:03.676
640a0bea-eb25-48be-8d80-bf4b7678340d	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	event_assigned	Asignado a evento	Fuiste asignado al evento "Congreso de Creación Biblica"	/events?open=34b5399d-131e-4031-8d95-1899eba63a01	f	{"eventId": "34b5399d-131e-4031-8d95-1899eba63a01"}	2026-01-13 19:20:52.336
9f56d3ac-f74e-41ee-bcc5-4e7087099b56	935f08e0-03bd-4828-8603-3d0f6d08499a	event_assigned	Asignado a evento	Fuiste asignado al evento "Congreso de Creación Biblica"	/events?open=34b5399d-131e-4031-8d95-1899eba63a01	f	{"eventId": "34b5399d-131e-4031-8d95-1899eba63a01"}	2026-01-13 19:20:52.336
1f4036e6-5c8c-4d66-9c80-3fb3cb502fd7	bb5578ba-07aa-46b5-be23-99f71446fab5	event_assigned	Asignado a evento	Fuiste asignado al evento "Congreso de Creación Biblica"	/events?open=34b5399d-131e-4031-8d95-1899eba63a01	f	{"eventId": "34b5399d-131e-4031-8d95-1899eba63a01"}	2026-01-13 19:20:52.336
55b663d6-02a1-461e-a49b-fbd30752a971	935f08e0-03bd-4828-8603-3d0f6d08499a	event_assigned	Asignado a evento	Fuiste asignado al evento "Fotos de Graduandos Terapia Fisica"	/events?open=1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	f	{"eventId": "1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb"}	2026-01-13 19:29:38.293
54dc76e7-b2d8-4f69-b16b-93e772a6bb50	0c11645d-89dc-441e-a1c8-270d7999255f	event_assigned	Asignado a evento	Fuiste asignado al evento "Inauguración del Curso Primavera 2026"	/events?open=3a1b39da-ed47-4a32-85bc-bbaf02f4643e	t	{"eventId": "3a1b39da-ed47-4a32-85bc-bbaf02f4643e"}	2026-01-13 19:08:03.676
275c8a84-c6ac-499a-b5bf-569d838aec5e	0c11645d-89dc-441e-a1c8-270d7999255f	event_assigned	Asignado a evento	Fuiste asignado al evento "Congreso de Creación Biblica"	/events?open=34b5399d-131e-4031-8d95-1899eba63a01	t	{"eventId": "34b5399d-131e-4031-8d95-1899eba63a01"}	2026-01-13 19:20:52.336
3b5c2ab2-6a5b-4141-aac3-209cb2f27ff3	0c11645d-89dc-441e-a1c8-270d7999255f	event_assigned	Asignado a evento	Fuiste asignado al evento "Fotos de Graduandos Terapia Fisica"	/events?open=1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb	t	{"eventId": "1bfa7bcb-8acc-4474-af08-73c6ff4f9fdb"}	2026-01-13 19:29:38.292
bad9bb0c-37cc-4836-9109-7c527e6752c1	0c11645d-89dc-441e-a1c8-270d7999255f	event_assigned	Asignado a evento	Fuiste asignado al evento "Matricula Prioritaria"	/events?open=24d7c86d-bffd-4396-8920-3d1da6a49158	t	{"eventId": "24d7c86d-bffd-4396-8920-3d1da6a49158"}	2026-01-13 19:34:47.203
41518ceb-cccb-42cc-9eac-12ac23c7047b	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 02:26:58.923
d272758d-1c88-4abc-8b6d-b3b3de5233e3	99e80949-ce36-43e9-8e1b-2a1cee0472a9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 02:31:56.541
b78da5f0-9f42-4376-b73c-8b87baab10d8	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 02:32:14.555
5cab2056-3923-42a2-9e17-ba4a36371b3a	99e80949-ce36-43e9-8e1b-2a1cee0472a9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 02:40:18.056
cf1e4253-46d1-4f6b-b255-d3f25de10391	99e80949-ce36-43e9-8e1b-2a1cee0472a9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 02:40:51.666
ef587f54-6bfe-4b33-954c-17d62ad1d937	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 02:45:29.695
b219ab0e-df5f-4578-8569-eb1179e40513	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 02:47:06.013
3dd04e76-aada-423e-a220-a21840133d1e	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Fotografía"	/tasks?open=3b576a7c-eec6-4a3e-b01b-2340e8aa63d1	f	{"taskId": "3b576a7c-eec6-4a3e-b01b-2340e8aa63d1"}	2026-01-14 02:58:28.19
bf61149a-c171-4941-9824-be0e2a1a3ac0	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 03:03:19.842
fcf801b3-07a9-46ae-bc13-e4d499de2a1c	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Equipo transferido	Se te transfirió equipo de la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 03:03:22.753
1ae09aa1-c798-4508-b86b-14763cc719a3	0c11645d-89dc-441e-a1c8-270d7999255f	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	t	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 02:57:56.244
125887d2-0ee0-4060-b5b9-4df43a29c9f3	bb5578ba-07aa-46b5-be23-99f71446fab5	event_assigned	Asignado a evento	Fuiste asignado al evento "qq"	/events?open=ac0b4a60-7b57-4473-be33-b5b64b942187	f	{"eventId": "ac0b4a60-7b57-4473-be33-b5b64b942187"}	2026-01-14 03:51:28.168
1beb6824-a750-4af0-a71a-cab4b46e93a8	bb5578ba-07aa-46b5-be23-99f71446fab5	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 05:02:20.886
1ea86f0c-8e71-4544-8149-98c62338484e	bb5578ba-07aa-46b5-be23-99f71446fab5	task_assigned	Equipo transferido	Se te transfirió equipo de la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 05:02:24.085
a6624c2a-da3c-4869-9109-7eadd851dd1f	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Equipo transferido	Se te transfirió equipo de la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 05:02:28.512
6ce4511c-cc53-4706-aa37-5cfc0317ed12	935f08e0-03bd-4828-8603-3d0f6d08499a	task_assigned	Equipo transferido	Se te transfirió equipo de la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 22:35:31.718
68dfc51a-4d21-4bd3-86db-1425dfdbf7e6	935f08e0-03bd-4828-8603-3d0f6d08499a	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	f	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 22:36:06.938
126a467f-5645-4d69-af1e-7e60db909e25	99e80949-ce36-43e9-8e1b-2a1cee0472a9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Edición de video"	/tasks?open=81242654-9109-42e5-b0a9-3359fcb4d990	f	{"taskId": "81242654-9109-42e5-b0a9-3359fcb4d990"}	2026-01-15 02:39:13.515
0017466b-bbf4-44e5-b333-c6121cd6d7bd	bb5578ba-07aa-46b5-be23-99f71446fab5	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Edición de video"	/tasks?open=81242654-9109-42e5-b0a9-3359fcb4d990	f	{"taskId": "81242654-9109-42e5-b0a9-3359fcb4d990"}	2026-01-15 02:39:13.515
6ebfcdb5-5267-4e4e-a9db-884006e44347	5e193bad-0fbd-46aa-b6da-c67f168be207	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Fotos Inscripción "	/tasks?open=9b68ceaf-0876-435f-be4f-258e822f7e61	f	{"taskId": "9b68ceaf-0876-435f-be4f-258e822f7e61"}	2026-01-15 03:19:24.827
7d6a9de7-551c-438a-8bfc-d1721518d386	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	task_assigned	Nueva tarea asignada	Se te asignó la tarea "Foto de cierre de Matricula"	/tasks?open=39b349e1-938c-4d95-92fa-248a42a585b3	t	{"taskId": "39b349e1-938c-4d95-92fa-248a42a585b3"}	2026-01-14 05:02:31.077
\.


--
-- Data for Name: pending_rfids; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_rfids (id, rfid_tag, scanned_at, note) FROM stdin;
\.


--
-- Data for Name: solicitor_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitor_tokens (id, email, token, created_at) FROM stdin;
f27e6ac6-1cf2-4cde-b0ef-250ff0c7114a	christophercastellanos2004@gmail.com	623609	2026-01-13 20:13:17.109
\.


--
-- Data for Name: task_assignees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_assignees (task_id, user_id, assigned_at) FROM stdin;
958ac292-dd6d-47d8-8975-0ee664ca953d	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	2026-01-13 18:31:03.417
e67f4631-b680-431c-b4de-6c4455140eb7	0c11645d-89dc-441e-a1c8-270d7999255f	2026-01-13 18:33:01.282
39b349e1-938c-4d95-92fa-248a42a585b3	935f08e0-03bd-4828-8603-3d0f6d08499a	2026-01-14 22:36:06.931
81242654-9109-42e5-b0a9-3359fcb4d990	99e80949-ce36-43e9-8e1b-2a1cee0472a9	2026-01-15 02:39:13.506
81242654-9109-42e5-b0a9-3359fcb4d990	bb5578ba-07aa-46b5-be23-99f71446fab5	2026-01-15 02:39:13.506
9b68ceaf-0876-435f-be4f-258e822f7e61	5e193bad-0fbd-46aa-b6da-c67f168be207	2026-01-15 03:19:24.815
\.


--
-- Data for Name: task_checklist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_checklist_items (id, task_id, content, is_completed, "order", created_at, updated_at) FROM stdin;
57dcb1e9-34ce-4063-9167-17b50f3537da	e67f4631-b680-431c-b4de-6c4455140eb7	Enviar al correo de umedia	t	0	2026-01-13 18:43:20.896	2026-01-13 18:43:22.758
6d490553-3dbd-488f-9764-ac84bf604793	39b349e1-938c-4d95-92fa-248a42a585b3	Toma foto en la caja cuando estén pagando.	t	0	2026-01-13 18:36:53.873	2026-01-15 03:26:05.008
1a13aba3-859e-493e-96b1-a0869d6c5fda	39b349e1-938c-4d95-92fa-248a42a585b3	Pasar fotos a la compu A	t	1	2026-01-13 18:37:06.833	2026-01-15 03:26:06.751
b278182b-bebe-4bca-9347-1857205cde3e	39b349e1-938c-4d95-92fa-248a42a585b3	Vaciar SD	t	2	2026-01-13 18:37:48.615	2026-01-15 03:26:08.833
b493d251-0723-4009-8dd2-628eb6ec2d5a	39b349e1-938c-4d95-92fa-248a42a585b3	Mandame Foto que ya esta el equipo en su lugar	f	4	2026-01-13 18:38:27.452	2026-01-15 03:26:16.39
8888af54-9275-4462-84c7-ff4d33c5381c	39b349e1-938c-4d95-92fa-248a42a585b3	Dejar equipo en su Lugar	f	3	2026-01-13 18:37:25.882	2026-01-15 03:26:18.587
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, client_requirements, status, priority, due_date, execution_date, shift, morning_start_time, morning_end_time, afternoon_start_time, afternoon_end_time, created_by, created_at, updated_at) FROM stdin;
958ac292-dd6d-47d8-8975-0ee664ca953d	Recorte de Fotos Graduandos FACEJ	Recorte de fotos graduandos FACEJ del 2027 porfa que están en el mismo color del fondo. 	Es free	pending	medium	2026-01-16	2026-01-14	afternoon	\N	\N	14:30	18:30	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 18:31:03.417	2026-01-13 18:31:03.417
e67f4631-b680-431c-b4de-6c4455140eb7	Enviar foto de Credencial	Es la foto que tomo Salma en la tarde de la semana pasada, y ame la odio esta señora de RRHH	Que le quite las arrugas. 	review	high	2026-01-21	2026-01-21	morning	08:00	12:00	\N	\N	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 18:33:01.282	2026-01-14 03:23:26.063
81242654-9109-42e5-b0a9-3359fcb4d990	Edición de video	Esta es una tarea de prueba\n	\N	pending	high	2026-01-23	2026-01-29	afternoon	\N	\N	14:30	18:30	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-15 02:39:13.506	2026-01-15 02:39:13.506
39b349e1-938c-4d95-92fa-248a42a585b3	Foto de cierre de Matricula	Tomar fotos en los espacio de la UM como en Rectoría y en las facultades.\n- Toma foto en la caja cuando estén pagando. 	\N	completed	high	2026-01-16	2026-01-16	morning	10:00	10:40	\N	\N	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-13 18:36:00.087	2026-01-15 15:58:44.511
9b68ceaf-0876-435f-be4f-258e822f7e61	Fotos Inscripción 	Registrar con fotografía la llegada de los estudiantes a la UM	Diferentes ángulos diferentes lugares 	completed	high	2026-01-14	2026-01-14	morning	09:00	10:00	\N	\N	8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	2026-01-15 03:19:24.815	2026-01-15 15:58:56.75
\.


--
-- Data for Name: time_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_entries (id, user_id, event_id, clock_in, clock_out, total_hours, created_at) FROM stdin;
8a86b99c-b747-4722-bd78-b32ed8ce8772	0c11645d-89dc-441e-a1c8-270d7999255f	\N	2026-01-21 14:00:00	2026-01-21 22:00:00	8.00	2026-01-14 01:51:28.724
29b262dd-e0e5-4bb5-a091-aab67adaf960	bb5578ba-07aa-46b5-be23-99f71446fab5	\N	2026-01-21 14:00:00	2026-01-21 19:00:00	5.00	2026-01-14 01:51:48.279
cdbd0861-6f07-420d-9165-3b3a7b33091b	935f08e0-03bd-4828-8603-3d0f6d08499a	\N	2026-01-20 14:00:00	2026-01-20 22:00:00	8.00	2026-01-14 01:52:29.789
9daf200f-75bd-426a-972c-9716d22158fb	a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	\N	2026-01-20 14:00:00	2026-01-20 15:00:00	1.00	2026-01-14 01:52:43.041
cbea2eae-6330-42a1-ad3f-b13afdbc79e9	99e80949-ce36-43e9-8e1b-2a1cee0472a9	\N	2026-01-20 14:00:00	2026-01-20 20:00:00	6.00	2026-01-14 01:52:53.592
322c672b-b34e-452c-9c6a-728eb91c591a	0c11645d-89dc-441e-a1c8-270d7999255f	\N	2026-01-24 14:00:00	2026-01-24 18:00:00	4.00	2026-01-14 01:53:35.999
7b037f88-a70c-4162-a7f1-1ae7ac0268b1	0c11645d-89dc-441e-a1c8-270d7999255f	\N	2026-01-15 16:02:19.111	2026-01-15 16:02:21.157	0.00	2026-01-15 16:02:19.112
ac21099f-1b52-49b4-ac03-06f306f06042	0c11645d-89dc-441e-a1c8-270d7999255f	\N	2026-01-15 16:02:25.093	2026-01-15 16:02:39.64	0.00	2026-01-15 16:02:25.094
ab07a656-0993-42ca-88af-9954e955baee	0c11645d-89dc-441e-a1c8-270d7999255f	\N	2026-01-15 16:29:49.947	2026-01-15 16:36:35.031	0.11	2026-01-15 16:29:49.949
021de4ac-0219-4e77-8c0e-809a3c63f928	0c11645d-89dc-441e-a1c8-270d7999255f	\N	2026-01-15 16:46:30.257	2026-01-15 16:47:29.936	0.02	2026-01-15 16:46:30.258
\.


--
-- Data for Name: token_recovery_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_recovery_requests (id, email, token, status, created_at, sent_at) FROM stdin;
9e43582f-d714-4dbf-b485-2a32dae02246	christophercastellanos2004@gmail.com	623609	sent	2026-01-13 20:16:05.305	2026-01-13 20:16:49.434
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, rfid_tag, profile_image, role, is_active, created_at, updated_at) FROM stdin;
bb5578ba-07aa-46b5-be23-99f71446fab5	Ceila García	ceila@pulso.com	$2b$10$4hyTBjn2mp.vwbG4/UMycuaXBjTO/lAmbJyEv09hhmwbFZCW8kjne	\N	824aa295-3341-43a9-a5d3-018d780df401.png	becario	t	2026-01-13 18:24:08.126	2026-01-13 18:24:29.809
8de0bf35-8b8b-4ae0-978c-a9a7870a27ee	Jhoan Rueda	admin@pulso.edu.mx	$2b$10$DTE1b4XS2JAfv8aZ81Cfe.g02XObqwE9Xr8eGE.UBHtf.URq.dgaG	\N	120fd767-964e-421d-8944-2104d7c5fbb2.png	admin	t	2026-01-08 20:27:23.304	2026-01-13 18:21:26.955
935f08e0-03bd-4828-8603-3d0f6d08499a	Atzin García	atzin@pulso.com	$2b$10$gMOIp.S8XbDwgDJDzPuhH.0qreQ5RsC56UpgqxlINXki8bC9kSyKm	\N	8e91d35e-f6cf-4d35-9d57-5f9c294fc02e.png	becario	t	2026-01-13 18:23:14.818	2026-01-13 18:23:26.641
99e80949-ce36-43e9-8e1b-2a1cee0472a9	Sarai Treviño	sarait@pulso.com	$2b$10$aoA9yQp7gUV.SYQ2SXp7Su7mvBKg4glW4m8B16gFZKh5Md3SxPmhi	\N	03745b0f-36fb-463f-bd43-77cfd4350251.png	becario	t	2026-01-13 18:25:02.724	2026-01-13 18:26:07.785
5e193bad-0fbd-46aa-b6da-c67f168be207	Salma Ruiz	salma@pulso.edu.mx	$2b$10$LWbzlDVmCOmnuOMB/gX2qul2TiTjO6.ME8JBeTKoQ81FNxRe6agEi	\N	\N	becario	t	2026-01-15 03:15:49.755	2026-01-15 03:15:49.755
a6f0ff0d-b486-4c4e-91bc-fa67f7658dd9	Dania Gutierrrez	dania@pulso.com	$2b$10$DdaFSHOudmUJg4ehuFfcde7XframG4lIdRzTEiAU8BZb6Ej1wjms6	\N	5952f64a-2851-42e2-942d-1a834867674d.png	becario	t	2026-01-13 18:23:50.058	2026-01-15 03:36:44.744
0c11645d-89dc-441e-a1c8-270d7999255f	Christopher Castellanos	christophercastellanos2004@gmail.com	$2b$10$quVbcCbmVfynR4I8uba/re6NUFgZpjtHHLXFDLEbVVELKCmrvo0vm	ABF35105	0de5c7eb-d5e7-4f44-ae8b-5a5afeb81374.png	becario	t	2026-01-08 20:35:43.538	2026-01-15 16:02:01.889
\.


--
-- Data for Name: weekly_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weekly_logs (id, user_id, week_start, week_end, activities, achievements, challenges, learnings, next_goals, total_hours, created_at) FROM stdin;
\.


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: equipment_assignments equipment_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_assignments
    ADD CONSTRAINT equipment_assignments_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: equipment_usage_log_items equipment_usage_log_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_usage_log_items
    ADD CONSTRAINT equipment_usage_log_items_pkey PRIMARY KEY (id);


--
-- Name: equipment_usage_logs equipment_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_usage_logs
    ADD CONSTRAINT equipment_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: event_assignees event_assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_assignees
    ADD CONSTRAINT event_assignees_pkey PRIMARY KEY (event_id, user_id);


--
-- Name: event_checklist_items event_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_checklist_items
    ADD CONSTRAINT event_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: event_days event_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_days
    ADD CONSTRAINT event_days_pkey PRIMARY KEY (id);


--
-- Name: event_request_config event_request_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_request_config
    ADD CONSTRAINT event_request_config_pkey PRIMARY KEY (id);


--
-- Name: event_requests event_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_requests
    ADD CONSTRAINT event_requests_pkey PRIMARY KEY (id);


--
-- Name: event_shifts event_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_shifts
    ADD CONSTRAINT event_shifts_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: monthly_hours_config monthly_hours_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_hours_config
    ADD CONSTRAINT monthly_hours_config_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pending_rfids pending_rfids_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_rfids
    ADD CONSTRAINT pending_rfids_pkey PRIMARY KEY (id);


--
-- Name: solicitor_tokens solicitor_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitor_tokens
    ADD CONSTRAINT solicitor_tokens_pkey PRIMARY KEY (id);


--
-- Name: task_assignees task_assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_pkey PRIMARY KEY (task_id, user_id);


--
-- Name: task_checklist_items task_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_checklist_items
    ADD CONSTRAINT task_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);


--
-- Name: token_recovery_requests token_recovery_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_recovery_requests
    ADD CONSTRAINT token_recovery_requests_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: weekly_logs weekly_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_logs
    ADD CONSTRAINT weekly_logs_pkey PRIMARY KEY (id);


--
-- Name: attachments_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attachments_event_id_idx ON public.attachments USING btree (event_id);


--
-- Name: attachments_task_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attachments_task_id_idx ON public.attachments USING btree (task_id);


--
-- Name: comments_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comments_event_id_idx ON public.comments USING btree (event_id);


--
-- Name: comments_task_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comments_task_id_idx ON public.comments USING btree (task_id);


--
-- Name: comments_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comments_user_id_idx ON public.comments USING btree (user_id);


--
-- Name: equipment_assignments_equipment_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_assignments_equipment_id_idx ON public.equipment_assignments USING btree (equipment_id);


--
-- Name: equipment_assignments_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_assignments_event_id_idx ON public.equipment_assignments USING btree (event_id);


--
-- Name: equipment_assignments_event_shift_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_assignments_event_shift_id_idx ON public.equipment_assignments USING btree (event_shift_id);


--
-- Name: equipment_assignments_start_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_assignments_start_time_idx ON public.equipment_assignments USING btree (start_time);


--
-- Name: equipment_assignments_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_assignments_user_id_idx ON public.equipment_assignments USING btree (user_id);


--
-- Name: equipment_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_category_idx ON public.equipment USING btree (category);


--
-- Name: equipment_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_is_active_idx ON public.equipment USING btree (is_active);


--
-- Name: equipment_rfid_tag_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX equipment_rfid_tag_key ON public.equipment USING btree (rfid_tag);


--
-- Name: equipment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_status_idx ON public.equipment USING btree (status);


--
-- Name: equipment_usage_log_items_equipment_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_usage_log_items_equipment_id_idx ON public.equipment_usage_log_items USING btree (equipment_id);


--
-- Name: equipment_usage_log_items_log_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_usage_log_items_log_id_idx ON public.equipment_usage_log_items USING btree (log_id);


--
-- Name: equipment_usage_logs_logged_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_usage_logs_logged_at_idx ON public.equipment_usage_logs USING btree (logged_at);


--
-- Name: equipment_usage_logs_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_usage_logs_user_id_idx ON public.equipment_usage_logs USING btree (user_id);


--
-- Name: event_checklist_items_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX event_checklist_items_event_id_idx ON public.event_checklist_items USING btree (event_id);


--
-- Name: event_days_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX event_days_date_idx ON public.event_days USING btree (date);


--
-- Name: event_days_event_id_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX event_days_event_id_date_key ON public.event_days USING btree (event_id, date);


--
-- Name: event_days_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX event_days_event_id_idx ON public.event_days USING btree (event_id);


--
-- Name: event_request_config_access_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX event_request_config_access_code_key ON public.event_request_config USING btree (access_code);


--
-- Name: event_requests_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX event_requests_code_key ON public.event_requests USING btree (code);


--
-- Name: event_requests_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX event_requests_created_at_idx ON public.event_requests USING btree (created_at);


--
-- Name: event_requests_solicitante_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX event_requests_solicitante_email_idx ON public.event_requests USING btree (solicitante_email);


--
-- Name: event_requests_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX event_requests_status_idx ON public.event_requests USING btree (status);


--
-- Name: event_shifts_event_day_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX event_shifts_event_day_id_idx ON public.event_shifts USING btree (event_day_id);


--
-- Name: event_shifts_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX event_shifts_user_id_idx ON public.event_shifts USING btree (user_id);


--
-- Name: events_created_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_created_by_idx ON public.events USING btree (created_by);


--
-- Name: events_end_datetime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_end_datetime_idx ON public.events USING btree (end_datetime);


--
-- Name: events_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_event_type_idx ON public.events USING btree (event_type);


--
-- Name: events_start_datetime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_start_datetime_idx ON public.events USING btree (start_datetime);


--
-- Name: messages_conversation_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_conversation_id_idx ON public.messages USING btree (conversation_id);


--
-- Name: messages_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at);


--
-- Name: messages_sender_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_sender_id_idx ON public.messages USING btree (sender_id);


--
-- Name: monthly_hours_config_year_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX monthly_hours_config_year_idx ON public.monthly_hours_config USING btree (year);


--
-- Name: monthly_hours_config_year_month_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX monthly_hours_config_year_month_key ON public.monthly_hours_config USING btree (year, month);


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);


--
-- Name: notifications_is_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: pending_rfids_rfid_tag_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pending_rfids_rfid_tag_key ON public.pending_rfids USING btree (rfid_tag);


--
-- Name: pending_rfids_scanned_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pending_rfids_scanned_at_idx ON public.pending_rfids USING btree (scanned_at);


--
-- Name: solicitor_tokens_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX solicitor_tokens_email_key ON public.solicitor_tokens USING btree (email);


--
-- Name: solicitor_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX solicitor_tokens_token_key ON public.solicitor_tokens USING btree (token);


--
-- Name: task_checklist_items_task_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX task_checklist_items_task_id_idx ON public.task_checklist_items USING btree (task_id);


--
-- Name: tasks_created_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tasks_created_by_idx ON public.tasks USING btree (created_by);


--
-- Name: tasks_due_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tasks_due_date_idx ON public.tasks USING btree (due_date);


--
-- Name: tasks_execution_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tasks_execution_date_idx ON public.tasks USING btree (execution_date);


--
-- Name: tasks_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tasks_priority_idx ON public.tasks USING btree (priority);


--
-- Name: tasks_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tasks_status_idx ON public.tasks USING btree (status);


--
-- Name: time_entries_clock_in_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX time_entries_clock_in_idx ON public.time_entries USING btree (clock_in);


--
-- Name: time_entries_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX time_entries_event_id_idx ON public.time_entries USING btree (event_id);


--
-- Name: time_entries_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX time_entries_user_id_idx ON public.time_entries USING btree (user_id);


--
-- Name: token_recovery_requests_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX token_recovery_requests_created_at_idx ON public.token_recovery_requests USING btree (created_at);


--
-- Name: token_recovery_requests_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX token_recovery_requests_status_idx ON public.token_recovery_requests USING btree (status);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_is_active_idx ON public.users USING btree (is_active);


--
-- Name: users_rfid_tag_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_rfid_tag_key ON public.users USING btree (rfid_tag);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: weekly_logs_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX weekly_logs_user_id_idx ON public.weekly_logs USING btree (user_id);


--
-- Name: weekly_logs_user_id_week_start_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX weekly_logs_user_id_week_start_key ON public.weekly_logs USING btree (user_id, week_start);


--
-- Name: weekly_logs_week_start_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX weekly_logs_week_start_idx ON public.weekly_logs USING btree (week_start);


--
-- Name: attachments attachments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attachments attachments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attachments attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comments comments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipment_assignments equipment_assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_assignments
    ADD CONSTRAINT equipment_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: equipment_assignments equipment_assignments_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_assignments
    ADD CONSTRAINT equipment_assignments_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: equipment_assignments equipment_assignments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_assignments
    ADD CONSTRAINT equipment_assignments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: equipment_assignments equipment_assignments_event_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_assignments
    ADD CONSTRAINT equipment_assignments_event_shift_id_fkey FOREIGN KEY (event_shift_id) REFERENCES public.event_shifts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: equipment_assignments equipment_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_assignments
    ADD CONSTRAINT equipment_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: equipment_usage_log_items equipment_usage_log_items_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_usage_log_items
    ADD CONSTRAINT equipment_usage_log_items_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: equipment_usage_log_items equipment_usage_log_items_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_usage_log_items
    ADD CONSTRAINT equipment_usage_log_items_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.equipment_usage_logs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipment_usage_logs equipment_usage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_usage_logs
    ADD CONSTRAINT equipment_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: event_assignees event_assignees_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_assignees
    ADD CONSTRAINT event_assignees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_assignees event_assignees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_assignees
    ADD CONSTRAINT event_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_checklist_items event_checklist_items_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_checklist_items
    ADD CONSTRAINT event_checklist_items_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_days event_days_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_days
    ADD CONSTRAINT event_days_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_requests event_requests_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_requests
    ADD CONSTRAINT event_requests_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: event_shifts event_shifts_event_day_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_shifts
    ADD CONSTRAINT event_shifts_event_day_id_fkey FOREIGN KEY (event_day_id) REFERENCES public.event_days(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_shifts event_shifts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_shifts
    ADD CONSTRAINT event_shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: messages messages_attachment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES public.attachments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: monthly_hours_config monthly_hours_config_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_hours_config
    ADD CONSTRAINT monthly_hours_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_checklist_items task_checklist_items_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_checklist_items
    ADD CONSTRAINT task_checklist_items_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: time_entries time_entries_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: time_entries time_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: weekly_logs weekly_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_logs
    ADD CONSTRAINT weekly_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict AqPAdepUTCdxLCNSzRGckad8nbGDvr8QYdEwvlqGvd04IMDh6gwl4aL1oIec9zE

