--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5
-- Dumped by pg_dump version 14.4

-- Started on 2022-10-14 22:58:03

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 214 (class 1259 OID 16416)
-- Name: Candidate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Candidate" (
    candidate_id integer NOT NULL,
    name text NOT NULL,
    polling_order_id integer NOT NULL
);


ALTER TABLE public."Candidate" OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 16415)
-- Name: Candidate_candidate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Candidate_candidate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Candidate_candidate_id_seq" OWNER TO postgres;

--
-- TOC entry 3407 (class 0 OID 0)
-- Dependencies: 213
-- Name: Candidate_candidate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Candidate_candidate_id_seq" OWNED BY public."Candidate".candidate_id;


--
-- TOC entry 228 (class 1259 OID 16517)
-- Name: Candidate_polling_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Candidate_polling_order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Candidate_polling_order_id_seq" OWNER TO postgres;

--
-- TOC entry 3408 (class 0 OID 0)
-- Dependencies: 228
-- Name: Candidate_polling_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Candidate_polling_order_id_seq" OWNED BY public."Candidate".polling_order_id;


--
-- TOC entry 223 (class 1259 OID 16460)
-- Name: ExternalNotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ExternalNotes" (
    external_notes_id integer NOT NULL,
    candidate_id integer NOT NULL,
    polling_order_member_id integer NOT NULL,
    external_note text NOT NULL,
    en_created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."ExternalNotes" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16458)
-- Name: ExternalNotes_candidate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ExternalNotes_candidate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ExternalNotes_candidate_id_seq" OWNER TO postgres;

--
-- TOC entry 3409 (class 0 OID 0)
-- Dependencies: 221
-- Name: ExternalNotes_candidate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ExternalNotes_candidate_id_seq" OWNED BY public."ExternalNotes".candidate_id;


--
-- TOC entry 220 (class 1259 OID 16457)
-- Name: ExternalNotes_external_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ExternalNotes_external_notes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ExternalNotes_external_notes_id_seq" OWNER TO postgres;

--
-- TOC entry 3410 (class 0 OID 0)
-- Dependencies: 220
-- Name: ExternalNotes_external_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ExternalNotes_external_notes_id_seq" OWNED BY public."ExternalNotes".external_notes_id;


--
-- TOC entry 222 (class 1259 OID 16459)
-- Name: ExternalNotes_ws_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ExternalNotes_ws_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ExternalNotes_ws_id_seq" OWNER TO postgres;

--
-- TOC entry 3411 (class 0 OID 0)
-- Dependencies: 222
-- Name: ExternalNotes_ws_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ExternalNotes_ws_id_seq" OWNED BY public."ExternalNotes".polling_order_member_id;


--
-- TOC entry 212 (class 1259 OID 16407)
-- Name: Polling; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Polling" (
    polling_id integer NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    polling_order_id integer NOT NULL
);


ALTER TABLE public."Polling" OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 24758)
-- Name: PollingCandidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PollingCandidates" (
    polling_id integer NOT NULL,
    candidate_id integer NOT NULL,
    polling_candidate_id integer NOT NULL
);


ALTER TABLE public."PollingCandidates" OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 24757)
-- Name: PollingCandidates_polling_candidate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingCandidates_polling_candidate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingCandidates_polling_candidate_id_seq" OWNER TO postgres;

--
-- TOC entry 3412 (class 0 OID 0)
-- Dependencies: 232
-- Name: PollingCandidates_polling_candidate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingCandidates_polling_candidate_id_seq" OWNED BY public."PollingCandidates".polling_candidate_id;


--
-- TOC entry 219 (class 1259 OID 16428)
-- Name: PollingNotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PollingNotes" (
    polling_notes_id integer NOT NULL,
    note text,
    vote integer,
    polling_id integer NOT NULL,
    candidate_id integer NOT NULL,
    polling_order_id integer NOT NULL,
    pn_created_at timestamp without time zone DEFAULT now() NOT NULL,
    polling_order_member_id integer NOT NULL,
    completed boolean
);


ALTER TABLE public."PollingNotes" OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16426)
-- Name: PollingNotes_candidate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingNotes_candidate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingNotes_candidate_id_seq" OWNER TO postgres;

--
-- TOC entry 3413 (class 0 OID 0)
-- Dependencies: 217
-- Name: PollingNotes_candidate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingNotes_candidate_id_seq" OWNED BY public."PollingNotes".candidate_id;


--
-- TOC entry 216 (class 1259 OID 16425)
-- Name: PollingNotes_polling_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingNotes_polling_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingNotes_polling_id_seq" OWNER TO postgres;

--
-- TOC entry 3414 (class 0 OID 0)
-- Dependencies: 216
-- Name: PollingNotes_polling_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingNotes_polling_id_seq" OWNED BY public."PollingNotes".polling_id;


--
-- TOC entry 215 (class 1259 OID 16424)
-- Name: PollingNotes_polling_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingNotes_polling_notes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingNotes_polling_notes_id_seq" OWNER TO postgres;

--
-- TOC entry 3415 (class 0 OID 0)
-- Dependencies: 215
-- Name: PollingNotes_polling_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingNotes_polling_notes_id_seq" OWNED BY public."PollingNotes".polling_notes_id;


--
-- TOC entry 218 (class 1259 OID 16427)
-- Name: PollingNotes_ws_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingNotes_ws_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingNotes_ws_id_seq" OWNER TO postgres;

--
-- TOC entry 3416 (class 0 OID 0)
-- Dependencies: 218
-- Name: PollingNotes_ws_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingNotes_ws_id_seq" OWNED BY public."PollingNotes".polling_order_id;


--
-- TOC entry 225 (class 1259 OID 16481)
-- Name: PollingOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PollingOrder" (
    polling_order_id integer NOT NULL,
    polling_order_name text,
    polling_order_admin integer NOT NULL,
    polling_order_admin_assistant integer NOT NULL
);


ALTER TABLE public."PollingOrder" OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 16397)
-- Name: PollingOrderMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PollingOrderMember" (
    polling_order_member_id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text,
    polling_order_id integer NOT NULL,
    pom_created_at date NOT NULL,
    new_password_token integer,
    new_password_token_timestamp date,
    approved boolean DEFAULT false NOT NULL
);


ALTER TABLE public."PollingOrderMember" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16489)
-- Name: PollingOrderMember_polling_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingOrderMember_polling_order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingOrderMember_polling_order_id_seq" OWNER TO postgres;

--
-- TOC entry 3417 (class 0 OID 0)
-- Dependencies: 226
-- Name: PollingOrderMember_polling_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingOrderMember_polling_order_id_seq" OWNED BY public."PollingOrderMember".polling_order_id;


--
-- TOC entry 231 (class 1259 OID 16549)
-- Name: PollingOrderMember_polling_order_member_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."PollingOrderMember" ALTER COLUMN polling_order_member_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."PollingOrderMember_polling_order_member_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 230 (class 1259 OID 16538)
-- Name: PollingOrder_polling_order_admin_assistant_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingOrder_polling_order_admin_assistant_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingOrder_polling_order_admin_assistant_seq" OWNER TO postgres;

--
-- TOC entry 3418 (class 0 OID 0)
-- Dependencies: 230
-- Name: PollingOrder_polling_order_admin_assistant_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingOrder_polling_order_admin_assistant_seq" OWNED BY public."PollingOrder".polling_order_admin_assistant;


--
-- TOC entry 229 (class 1259 OID 16530)
-- Name: PollingOrder_polling_order_admin_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingOrder_polling_order_admin_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingOrder_polling_order_admin_seq" OWNER TO postgres;

--
-- TOC entry 3419 (class 0 OID 0)
-- Dependencies: 229
-- Name: PollingOrder_polling_order_admin_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingOrder_polling_order_admin_seq" OWNED BY public."PollingOrder".polling_order_admin;


--
-- TOC entry 224 (class 1259 OID 16480)
-- Name: PollingOrder_polling_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PollingOrder_polling_order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PollingOrder_polling_order_id_seq" OWNER TO postgres;

--
-- TOC entry 3420 (class 0 OID 0)
-- Dependencies: 224
-- Name: PollingOrder_polling_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PollingOrder_polling_order_id_seq" OWNED BY public."PollingOrder".polling_order_id;


--
-- TOC entry 211 (class 1259 OID 16406)
-- Name: Polling_polling_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Polling_polling_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Polling_polling_id_seq" OWNER TO postgres;

--
-- TOC entry 3421 (class 0 OID 0)
-- Dependencies: 211
-- Name: Polling_polling_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Polling_polling_id_seq" OWNED BY public."Polling".polling_id;


--
-- TOC entry 227 (class 1259 OID 16503)
-- Name: Polling_polling_order_member_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Polling_polling_order_member_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Polling_polling_order_member_id_seq" OWNER TO postgres;

--
-- TOC entry 3422 (class 0 OID 0)
-- Dependencies: 227
-- Name: Polling_polling_order_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Polling_polling_order_member_id_seq" OWNED BY public."Polling".polling_order_id;


--
-- TOC entry 209 (class 1259 OID 16396)
-- Name: WhiteScarves_ws_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WhiteScarves_ws_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."WhiteScarves_ws_id_seq" OWNER TO postgres;

--
-- TOC entry 3423 (class 0 OID 0)
-- Dependencies: 209
-- Name: WhiteScarves_ws_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WhiteScarves_ws_id_seq" OWNED BY public."PollingOrderMember".polling_order_member_id;


--
-- TOC entry 3207 (class 2604 OID 16419)
-- Name: Candidate candidate_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidate" ALTER COLUMN candidate_id SET DEFAULT nextval('public."Candidate_candidate_id_seq"'::regclass);


--
-- TOC entry 3210 (class 2604 OID 16463)
-- Name: ExternalNotes external_notes_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExternalNotes" ALTER COLUMN external_notes_id SET DEFAULT nextval('public."ExternalNotes_external_notes_id_seq"'::regclass);


--
-- TOC entry 3206 (class 2604 OID 16410)
-- Name: Polling polling_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Polling" ALTER COLUMN polling_id SET DEFAULT nextval('public."Polling_polling_id_seq"'::regclass);


--
-- TOC entry 3213 (class 2604 OID 24761)
-- Name: PollingCandidates polling_candidate_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingCandidates" ALTER COLUMN polling_candidate_id SET DEFAULT nextval('public."PollingCandidates_polling_candidate_id_seq"'::regclass);


--
-- TOC entry 3208 (class 2604 OID 16431)
-- Name: PollingNotes polling_notes_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingNotes" ALTER COLUMN polling_notes_id SET DEFAULT nextval('public."PollingNotes_polling_notes_id_seq"'::regclass);


--
-- TOC entry 3212 (class 2604 OID 16484)
-- Name: PollingOrder polling_order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingOrder" ALTER COLUMN polling_order_id SET DEFAULT nextval('public."PollingOrder_polling_order_id_seq"'::regclass);


--
-- TOC entry 3382 (class 0 OID 16416)
-- Dependencies: 214
-- Data for Name: Candidate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Candidate" (candidate_id, name, polling_order_id) FROM stdin;
2	Competent Candidate	1
3	Competent Candidate 22222	1
4	Competent Candidate 3333333	1
\.


--
-- TOC entry 3391 (class 0 OID 16460)
-- Dependencies: 223
-- Data for Name: ExternalNotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ExternalNotes" (external_notes_id, candidate_id, polling_order_member_id, external_note, en_created_at) FROM stdin;
\.


--
-- TOC entry 3380 (class 0 OID 16407)
-- Dependencies: 212
-- Data for Name: Polling; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Polling" (polling_id, name, start_date, end_date, polling_order_id) FROM stdin;
2	Fall Polling	2022-10-01	2022-10-13	1
\.


--
-- TOC entry 3401 (class 0 OID 24758)
-- Dependencies: 233
-- Data for Name: PollingCandidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PollingCandidates" (polling_id, candidate_id, polling_candidate_id) FROM stdin;
2	2	1
2	3	2
2	4	3
\.


--
-- TOC entry 3387 (class 0 OID 16428)
-- Dependencies: 219
-- Data for Name: PollingNotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PollingNotes" (polling_notes_id, note, vote, polling_id, candidate_id, polling_order_id, pn_created_at, polling_order_member_id, completed) FROM stdin;
1	Newguy is good	\N	2	2	1	2022-09-01 20:00:00	1	f
\.


--
-- TOC entry 3393 (class 0 OID 16481)
-- Dependencies: 225
-- Data for Name: PollingOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PollingOrder" (polling_order_id, polling_order_name, polling_order_admin, polling_order_admin_assistant) FROM stdin;
1	White Scarf	1	1
5	Scarlet Guard	63	63
\.


--
-- TOC entry 3378 (class 0 OID 16397)
-- Dependencies: 210
-- Data for Name: PollingOrderMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PollingOrderMember" (polling_order_member_id, name, email, password, polling_order_id, pom_created_at, new_password_token, new_password_token_timestamp, approved) FROM stdin;
63	Juan Miguel Cezar	111111@gmail.com	$2b$10$UkcDIdA8yynTZrMnUKgt4ezhSNdcc5pYprtLJ4.G4j7Y8S9t0LNsy	5	2022-10-14	\N	\N	t
64	New Guy Scarlet Guard	some1243555544@some.com	$2b$10$ak84ggu5Nqm6Zjlz3VWtDeylAY.S24hwGpkiAmFgYN5rK3pLihPKm	5	2022-09-01	\N	\N	f
1	Markus skalpr Grimsson	111111@gmail.com	$2b$10$WMA6o2VpVquNtF5ceWsRe.K0LFAooZab8EqGWokIWp65joYsDyQty	1	2022-09-11	0	2022-10-02	t
17	Donnan	some@some.com	$2b$10$2Cyk/t9EihvL0AypsJvmNe8kO07zdKZTO.MsZmKT8JpIDq5QqIBIG	1	2022-09-11	\N	\N	t
62	Newguy eeeee	some1243555544@some.com	$2b$10$FYkBujKMihsGFbZSaxbmtu..oWapp3vDlgKofriqQU8PVDfBXjxCG	1	2022-10-14	\N	\N	t
\.


--
-- TOC entry 3424 (class 0 OID 0)
-- Dependencies: 213
-- Name: Candidate_candidate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Candidate_candidate_id_seq"', 4, true);


--
-- TOC entry 3425 (class 0 OID 0)
-- Dependencies: 228
-- Name: Candidate_polling_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Candidate_polling_order_id_seq"', 1, false);


--
-- TOC entry 3426 (class 0 OID 0)
-- Dependencies: 221
-- Name: ExternalNotes_candidate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ExternalNotes_candidate_id_seq"', 1, false);


--
-- TOC entry 3427 (class 0 OID 0)
-- Dependencies: 220
-- Name: ExternalNotes_external_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ExternalNotes_external_notes_id_seq"', 1, false);


--
-- TOC entry 3428 (class 0 OID 0)
-- Dependencies: 222
-- Name: ExternalNotes_ws_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ExternalNotes_ws_id_seq"', 1, false);


--
-- TOC entry 3429 (class 0 OID 0)
-- Dependencies: 232
-- Name: PollingCandidates_polling_candidate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingCandidates_polling_candidate_id_seq"', 6, true);


--
-- TOC entry 3430 (class 0 OID 0)
-- Dependencies: 217
-- Name: PollingNotes_candidate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingNotes_candidate_id_seq"', 1, false);


--
-- TOC entry 3431 (class 0 OID 0)
-- Dependencies: 216
-- Name: PollingNotes_polling_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingNotes_polling_id_seq"', 1, false);


--
-- TOC entry 3432 (class 0 OID 0)
-- Dependencies: 215
-- Name: PollingNotes_polling_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingNotes_polling_notes_id_seq"', 2, true);


--
-- TOC entry 3433 (class 0 OID 0)
-- Dependencies: 218
-- Name: PollingNotes_ws_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingNotes_ws_id_seq"', 1, false);


--
-- TOC entry 3434 (class 0 OID 0)
-- Dependencies: 226
-- Name: PollingOrderMember_polling_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingOrderMember_polling_order_id_seq"', 6, true);


--
-- TOC entry 3435 (class 0 OID 0)
-- Dependencies: 231
-- Name: PollingOrderMember_polling_order_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingOrderMember_polling_order_member_id_seq"', 64, true);


--
-- TOC entry 3436 (class 0 OID 0)
-- Dependencies: 230
-- Name: PollingOrder_polling_order_admin_assistant_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingOrder_polling_order_admin_assistant_seq"', 1, true);


--
-- TOC entry 3437 (class 0 OID 0)
-- Dependencies: 229
-- Name: PollingOrder_polling_order_admin_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingOrder_polling_order_admin_seq"', 1, false);


--
-- TOC entry 3438 (class 0 OID 0)
-- Dependencies: 224
-- Name: PollingOrder_polling_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PollingOrder_polling_order_id_seq"', 5, true);


--
-- TOC entry 3439 (class 0 OID 0)
-- Dependencies: 211
-- Name: Polling_polling_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Polling_polling_id_seq"', 2, true);


--
-- TOC entry 3440 (class 0 OID 0)
-- Dependencies: 227
-- Name: Polling_polling_order_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Polling_polling_order_member_id_seq"', 1, false);


--
-- TOC entry 3441 (class 0 OID 0)
-- Dependencies: 209
-- Name: WhiteScarves_ws_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WhiteScarves_ws_id_seq"', 6, true);


--
-- TOC entry 3220 (class 2606 OID 16423)
-- Name: Candidate Candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_pkey" PRIMARY KEY (candidate_id);


--
-- TOC entry 3227 (class 2606 OID 16469)
-- Name: ExternalNotes ExternalNotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExternalNotes"
    ADD CONSTRAINT "ExternalNotes_pkey" PRIMARY KEY (external_notes_id);


--
-- TOC entry 3231 (class 2606 OID 24763)
-- Name: PollingCandidates PollingCandidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingCandidates"
    ADD CONSTRAINT "PollingCandidates_pkey" PRIMARY KEY (polling_candidate_id);


--
-- TOC entry 3222 (class 2606 OID 16438)
-- Name: PollingNotes PollingNotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingNotes"
    ADD CONSTRAINT "PollingNotes_pkey" PRIMARY KEY (polling_notes_id);


--
-- TOC entry 3215 (class 2606 OID 16402)
-- Name: PollingOrderMember PollingOrderMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingOrderMember"
    ADD CONSTRAINT "PollingOrderMember_pkey" PRIMARY KEY (polling_order_member_id);


--
-- TOC entry 3229 (class 2606 OID 16488)
-- Name: PollingOrder PollingOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingOrder"
    ADD CONSTRAINT "PollingOrder_pkey" PRIMARY KEY (polling_order_id);


--
-- TOC entry 3218 (class 2606 OID 16414)
-- Name: Polling Polling_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Polling"
    ADD CONSTRAINT "Polling_pkey" PRIMARY KEY (polling_id);


--
-- TOC entry 3223 (class 1259 OID 16450)
-- Name: fki_candidate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_candidate_id ON public."PollingNotes" USING btree (candidate_id);


--
-- TOC entry 3224 (class 1259 OID 16444)
-- Name: fki_polling_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_polling_id ON public."PollingNotes" USING btree (polling_id);


--
-- TOC entry 3216 (class 1259 OID 16502)
-- Name: fki_polling_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_polling_order_id ON public."PollingOrderMember" USING btree (polling_order_id);


--
-- TOC entry 3225 (class 1259 OID 16456)
-- Name: fki_ws_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_ws_id ON public."PollingNotes" USING btree (polling_order_id);


--
-- TOC entry 3235 (class 2606 OID 16445)
-- Name: PollingNotes candidate_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingNotes"
    ADD CONSTRAINT candidate_id FOREIGN KEY (candidate_id) REFERENCES public."Candidate"(candidate_id) NOT VALID;


--
-- TOC entry 3236 (class 2606 OID 16470)
-- Name: ExternalNotes candidate_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExternalNotes"
    ADD CONSTRAINT candidate_id FOREIGN KEY (candidate_id) REFERENCES public."Candidate"(candidate_id) NOT VALID;


--
-- TOC entry 3234 (class 2606 OID 16439)
-- Name: PollingNotes polling_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PollingNotes"
    ADD CONSTRAINT polling_id FOREIGN KEY (polling_id) REFERENCES public."Polling"(polling_id) NOT VALID;


--
-- TOC entry 3237 (class 2606 OID 16475)
-- Name: ExternalNotes polling_order_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExternalNotes"
    ADD CONSTRAINT polling_order_id FOREIGN KEY (polling_order_member_id) REFERENCES public."PollingOrderMember"(polling_order_member_id) NOT VALID;


--
-- TOC entry 3232 (class 2606 OID 16512)
-- Name: Polling polling_order_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Polling"
    ADD CONSTRAINT polling_order_id FOREIGN KEY (polling_order_id) REFERENCES public."PollingOrder"(polling_order_id) NOT VALID;


--
-- TOC entry 3233 (class 2606 OID 16525)
-- Name: Candidate polling_order_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT polling_order_id FOREIGN KEY (polling_order_id) REFERENCES public."PollingOrder"(polling_order_id) NOT VALID;


-- Completed on 2022-10-14 22:58:04

--
-- PostgreSQL database dump complete
--

