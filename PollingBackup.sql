PGDMP                     	    z           polling    14.5    14.4 ^    K           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            L           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            M           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            N           1262    16394    polling    DATABASE     k   CREATE DATABASE polling WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'English_United States.1252';
    DROP DATABASE polling;
                postgres    false            �            1259    16416 	   Candidate    TABLE     �   CREATE TABLE public."Candidate" (
    candidate_id integer NOT NULL,
    name text NOT NULL,
    polling_order_id integer NOT NULL
);
    DROP TABLE public."Candidate";
       public         heap    postgres    false            �            1259    16415    Candidate_candidate_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Candidate_candidate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public."Candidate_candidate_id_seq";
       public          postgres    false    214            O           0    0    Candidate_candidate_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public."Candidate_candidate_id_seq" OWNED BY public."Candidate".candidate_id;
          public          postgres    false    213            �            1259    16517    Candidate_polling_order_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Candidate_polling_order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public."Candidate_polling_order_id_seq";
       public          postgres    false    214            P           0    0    Candidate_polling_order_id_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public."Candidate_polling_order_id_seq" OWNED BY public."Candidate".polling_order_id;
          public          postgres    false    228            �            1259    16460    ExternalNotes    TABLE       CREATE TABLE public."ExternalNotes" (
    external_notes_id integer NOT NULL,
    candidate_id integer NOT NULL,
    polling_order_member_id integer NOT NULL,
    external_note text NOT NULL,
    en_created_at timestamp without time zone DEFAULT now() NOT NULL
);
 #   DROP TABLE public."ExternalNotes";
       public         heap    postgres    false            �            1259    16458    ExternalNotes_candidate_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ExternalNotes_candidate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public."ExternalNotes_candidate_id_seq";
       public          postgres    false    223            Q           0    0    ExternalNotes_candidate_id_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public."ExternalNotes_candidate_id_seq" OWNED BY public."ExternalNotes".candidate_id;
          public          postgres    false    221            �            1259    16457 #   ExternalNotes_external_notes_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ExternalNotes_external_notes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 <   DROP SEQUENCE public."ExternalNotes_external_notes_id_seq";
       public          postgres    false    223            R           0    0 #   ExternalNotes_external_notes_id_seq    SEQUENCE OWNED BY     o   ALTER SEQUENCE public."ExternalNotes_external_notes_id_seq" OWNED BY public."ExternalNotes".external_notes_id;
          public          postgres    false    220            �            1259    16459    ExternalNotes_ws_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ExternalNotes_ws_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public."ExternalNotes_ws_id_seq";
       public          postgres    false    223            S           0    0    ExternalNotes_ws_id_seq    SEQUENCE OWNED BY     i   ALTER SEQUENCE public."ExternalNotes_ws_id_seq" OWNED BY public."ExternalNotes".polling_order_member_id;
          public          postgres    false    222            �            1259    16407    Polling    TABLE     �   CREATE TABLE public."Polling" (
    polling_id integer NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    polling_order_id integer NOT NULL
);
    DROP TABLE public."Polling";
       public         heap    postgres    false            �            1259    24758    PollingCandidates    TABLE     �   CREATE TABLE public."PollingCandidates" (
    polling_id integer NOT NULL,
    candidate_id integer NOT NULL,
    polling_candidate_id integer NOT NULL
);
 '   DROP TABLE public."PollingCandidates";
       public         heap    postgres    false            �            1259    24757 *   PollingCandidates_polling_candidate_id_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingCandidates_polling_candidate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 C   DROP SEQUENCE public."PollingCandidates_polling_candidate_id_seq";
       public          postgres    false    233            T           0    0 *   PollingCandidates_polling_candidate_id_seq    SEQUENCE OWNED BY     }   ALTER SEQUENCE public."PollingCandidates_polling_candidate_id_seq" OWNED BY public."PollingCandidates".polling_candidate_id;
          public          postgres    false    232            �            1259    16428    PollingNotes    TABLE     e  CREATE TABLE public."PollingNotes" (
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
 "   DROP TABLE public."PollingNotes";
       public         heap    postgres    false            �            1259    16426    PollingNotes_candidate_id_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingNotes_candidate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public."PollingNotes_candidate_id_seq";
       public          postgres    false    219            U           0    0    PollingNotes_candidate_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public."PollingNotes_candidate_id_seq" OWNED BY public."PollingNotes".candidate_id;
          public          postgres    false    217            �            1259    16425    PollingNotes_polling_id_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingNotes_polling_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public."PollingNotes_polling_id_seq";
       public          postgres    false    219            V           0    0    PollingNotes_polling_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public."PollingNotes_polling_id_seq" OWNED BY public."PollingNotes".polling_id;
          public          postgres    false    216            �            1259    16424 !   PollingNotes_polling_notes_id_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingNotes_polling_notes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 :   DROP SEQUENCE public."PollingNotes_polling_notes_id_seq";
       public          postgres    false    219            W           0    0 !   PollingNotes_polling_notes_id_seq    SEQUENCE OWNED BY     k   ALTER SEQUENCE public."PollingNotes_polling_notes_id_seq" OWNED BY public."PollingNotes".polling_notes_id;
          public          postgres    false    215            �            1259    16427    PollingNotes_ws_id_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingNotes_ws_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."PollingNotes_ws_id_seq";
       public          postgres    false    219            X           0    0    PollingNotes_ws_id_seq    SEQUENCE OWNED BY     `   ALTER SEQUENCE public."PollingNotes_ws_id_seq" OWNED BY public."PollingNotes".polling_order_id;
          public          postgres    false    218            �            1259    16481    PollingOrder    TABLE     �   CREATE TABLE public."PollingOrder" (
    polling_order_id integer NOT NULL,
    polling_order_name text,
    polling_order_admin integer NOT NULL,
    polling_order_admin_assistant integer
);
 "   DROP TABLE public."PollingOrder";
       public         heap    postgres    false            �            1259    16397    PollingOrderMember    TABLE     /  CREATE TABLE public."PollingOrderMember" (
    polling_order_member_id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text,
    polling_order_id integer NOT NULL,
    pom_created_at date NOT NULL,
    new_password_token integer,
    new_password_token_timestamp date
);
 (   DROP TABLE public."PollingOrderMember";
       public         heap    postgres    false            �            1259    16489 '   PollingOrderMember_polling_order_id_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingOrderMember_polling_order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 @   DROP SEQUENCE public."PollingOrderMember_polling_order_id_seq";
       public          postgres    false    210            Y           0    0 '   PollingOrderMember_polling_order_id_seq    SEQUENCE OWNED BY     w   ALTER SEQUENCE public."PollingOrderMember_polling_order_id_seq" OWNED BY public."PollingOrderMember".polling_order_id;
          public          postgres    false    226            �            1259    16549 .   PollingOrderMember_polling_order_member_id_seq    SEQUENCE       ALTER TABLE public."PollingOrderMember" ALTER COLUMN polling_order_member_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."PollingOrderMember_polling_order_member_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    210            �            1259    16538 .   PollingOrder_polling_order_admin_assistant_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingOrder_polling_order_admin_assistant_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 G   DROP SEQUENCE public."PollingOrder_polling_order_admin_assistant_seq";
       public          postgres    false    225            Z           0    0 .   PollingOrder_polling_order_admin_assistant_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public."PollingOrder_polling_order_admin_assistant_seq" OWNED BY public."PollingOrder".polling_order_admin_assistant;
          public          postgres    false    230            �            1259    16530 $   PollingOrder_polling_order_admin_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingOrder_polling_order_admin_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 =   DROP SEQUENCE public."PollingOrder_polling_order_admin_seq";
       public          postgres    false    225            [           0    0 $   PollingOrder_polling_order_admin_seq    SEQUENCE OWNED BY     q   ALTER SEQUENCE public."PollingOrder_polling_order_admin_seq" OWNED BY public."PollingOrder".polling_order_admin;
          public          postgres    false    229            �            1259    16480 !   PollingOrder_polling_order_id_seq    SEQUENCE     �   CREATE SEQUENCE public."PollingOrder_polling_order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 :   DROP SEQUENCE public."PollingOrder_polling_order_id_seq";
       public          postgres    false    225            \           0    0 !   PollingOrder_polling_order_id_seq    SEQUENCE OWNED BY     k   ALTER SEQUENCE public."PollingOrder_polling_order_id_seq" OWNED BY public."PollingOrder".polling_order_id;
          public          postgres    false    224            �            1259    16406    Polling_polling_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Polling_polling_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."Polling_polling_id_seq";
       public          postgres    false    212            ]           0    0    Polling_polling_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public."Polling_polling_id_seq" OWNED BY public."Polling".polling_id;
          public          postgres    false    211            �            1259    16503 #   Polling_polling_order_member_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Polling_polling_order_member_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 <   DROP SEQUENCE public."Polling_polling_order_member_id_seq";
       public          postgres    false    212            ^           0    0 #   Polling_polling_order_member_id_seq    SEQUENCE OWNED BY     h   ALTER SEQUENCE public."Polling_polling_order_member_id_seq" OWNED BY public."Polling".polling_order_id;
          public          postgres    false    227            �            1259    16396    WhiteScarves_ws_id_seq    SEQUENCE     �   CREATE SEQUENCE public."WhiteScarves_ws_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."WhiteScarves_ws_id_seq";
       public          postgres    false    210            _           0    0    WhiteScarves_ws_id_seq    SEQUENCE OWNED BY     m   ALTER SEQUENCE public."WhiteScarves_ws_id_seq" OWNED BY public."PollingOrderMember".polling_order_member_id;
          public          postgres    false    209            �           2604    16419    Candidate candidate_id    DEFAULT     �   ALTER TABLE ONLY public."Candidate" ALTER COLUMN candidate_id SET DEFAULT nextval('public."Candidate_candidate_id_seq"'::regclass);
 G   ALTER TABLE public."Candidate" ALTER COLUMN candidate_id DROP DEFAULT;
       public          postgres    false    214    213    214            �           2604    16463    ExternalNotes external_notes_id    DEFAULT     �   ALTER TABLE ONLY public."ExternalNotes" ALTER COLUMN external_notes_id SET DEFAULT nextval('public."ExternalNotes_external_notes_id_seq"'::regclass);
 P   ALTER TABLE public."ExternalNotes" ALTER COLUMN external_notes_id DROP DEFAULT;
       public          postgres    false    220    223    223            �           2604    16410    Polling polling_id    DEFAULT     |   ALTER TABLE ONLY public."Polling" ALTER COLUMN polling_id SET DEFAULT nextval('public."Polling_polling_id_seq"'::regclass);
 C   ALTER TABLE public."Polling" ALTER COLUMN polling_id DROP DEFAULT;
       public          postgres    false    212    211    212            �           2604    24761 &   PollingCandidates polling_candidate_id    DEFAULT     �   ALTER TABLE ONLY public."PollingCandidates" ALTER COLUMN polling_candidate_id SET DEFAULT nextval('public."PollingCandidates_polling_candidate_id_seq"'::regclass);
 W   ALTER TABLE public."PollingCandidates" ALTER COLUMN polling_candidate_id DROP DEFAULT;
       public          postgres    false    232    233    233            �           2604    16431    PollingNotes polling_notes_id    DEFAULT     �   ALTER TABLE ONLY public."PollingNotes" ALTER COLUMN polling_notes_id SET DEFAULT nextval('public."PollingNotes_polling_notes_id_seq"'::regclass);
 N   ALTER TABLE public."PollingNotes" ALTER COLUMN polling_notes_id DROP DEFAULT;
       public          postgres    false    219    215    219            �           2604    16484    PollingOrder polling_order_id    DEFAULT     �   ALTER TABLE ONLY public."PollingOrder" ALTER COLUMN polling_order_id SET DEFAULT nextval('public."PollingOrder_polling_order_id_seq"'::regclass);
 N   ALTER TABLE public."PollingOrder" ALTER COLUMN polling_order_id DROP DEFAULT;
       public          postgres    false    225    224    225            5          0    16416 	   Candidate 
   TABLE DATA           K   COPY public."Candidate" (candidate_id, name, polling_order_id) FROM stdin;
    public          postgres    false    214   �s       >          0    16460    ExternalNotes 
   TABLE DATA           �   COPY public."ExternalNotes" (external_notes_id, candidate_id, polling_order_member_id, external_note, en_created_at) FROM stdin;
    public          postgres    false    223   .t       3          0    16407    Polling 
   TABLE DATA           ]   COPY public."Polling" (polling_id, name, start_date, end_date, polling_order_id) FROM stdin;
    public          postgres    false    212   Kt       H          0    24758    PollingCandidates 
   TABLE DATA           ]   COPY public."PollingCandidates" (polling_id, candidate_id, polling_candidate_id) FROM stdin;
    public          postgres    false    233   �t       :          0    16428    PollingNotes 
   TABLE DATA           �   COPY public."PollingNotes" (polling_notes_id, note, vote, polling_id, candidate_id, polling_order_id, pn_created_at, polling_order_member_id, completed) FROM stdin;
    public          postgres    false    219   �t       @          0    16481    PollingOrder 
   TABLE DATA           �   COPY public."PollingOrder" (polling_order_id, polling_order_name, polling_order_admin, polling_order_admin_assistant) FROM stdin;
    public          postgres    false    225   �t       1          0    16397    PollingOrderMember 
   TABLE DATA           �   COPY public."PollingOrderMember" (polling_order_member_id, name, email, password, polling_order_id, pom_created_at, new_password_token, new_password_token_timestamp) FROM stdin;
    public          postgres    false    210   -u       `           0    0    Candidate_candidate_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public."Candidate_candidate_id_seq"', 4, true);
          public          postgres    false    213            a           0    0    Candidate_polling_order_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public."Candidate_polling_order_id_seq"', 1, false);
          public          postgres    false    228            b           0    0    ExternalNotes_candidate_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public."ExternalNotes_candidate_id_seq"', 1, false);
          public          postgres    false    221            c           0    0 #   ExternalNotes_external_notes_id_seq    SEQUENCE SET     T   SELECT pg_catalog.setval('public."ExternalNotes_external_notes_id_seq"', 1, false);
          public          postgres    false    220            d           0    0    ExternalNotes_ws_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public."ExternalNotes_ws_id_seq"', 1, false);
          public          postgres    false    222            e           0    0 *   PollingCandidates_polling_candidate_id_seq    SEQUENCE SET     Z   SELECT pg_catalog.setval('public."PollingCandidates_polling_candidate_id_seq"', 6, true);
          public          postgres    false    232            f           0    0    PollingNotes_candidate_id_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public."PollingNotes_candidate_id_seq"', 1, false);
          public          postgres    false    217            g           0    0    PollingNotes_polling_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public."PollingNotes_polling_id_seq"', 1, false);
          public          postgres    false    216            h           0    0 !   PollingNotes_polling_notes_id_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public."PollingNotes_polling_notes_id_seq"', 2, true);
          public          postgres    false    215            i           0    0    PollingNotes_ws_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public."PollingNotes_ws_id_seq"', 1, false);
          public          postgres    false    218            j           0    0 '   PollingOrderMember_polling_order_id_seq    SEQUENCE SET     W   SELECT pg_catalog.setval('public."PollingOrderMember_polling_order_id_seq"', 6, true);
          public          postgres    false    226            k           0    0 .   PollingOrderMember_polling_order_member_id_seq    SEQUENCE SET     _   SELECT pg_catalog.setval('public."PollingOrderMember_polling_order_member_id_seq"', 61, true);
          public          postgres    false    231            l           0    0 .   PollingOrder_polling_order_admin_assistant_seq    SEQUENCE SET     ^   SELECT pg_catalog.setval('public."PollingOrder_polling_order_admin_assistant_seq"', 1, true);
          public          postgres    false    230            m           0    0 $   PollingOrder_polling_order_admin_seq    SEQUENCE SET     U   SELECT pg_catalog.setval('public."PollingOrder_polling_order_admin_seq"', 1, false);
          public          postgres    false    229            n           0    0 !   PollingOrder_polling_order_id_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public."PollingOrder_polling_order_id_seq"', 3, true);
          public          postgres    false    224            o           0    0    Polling_polling_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public."Polling_polling_id_seq"', 2, true);
          public          postgres    false    211            p           0    0 #   Polling_polling_order_member_id_seq    SEQUENCE SET     T   SELECT pg_catalog.setval('public."Polling_polling_order_member_id_seq"', 1, false);
          public          postgres    false    227            q           0    0    WhiteScarves_ws_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public."WhiteScarves_ws_id_seq"', 6, true);
          public          postgres    false    209            �           2606    16423    Candidate Candidate_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_pkey" PRIMARY KEY (candidate_id);
 F   ALTER TABLE ONLY public."Candidate" DROP CONSTRAINT "Candidate_pkey";
       public            postgres    false    214            �           2606    16469     ExternalNotes ExternalNotes_pkey 
   CONSTRAINT     q   ALTER TABLE ONLY public."ExternalNotes"
    ADD CONSTRAINT "ExternalNotes_pkey" PRIMARY KEY (external_notes_id);
 N   ALTER TABLE ONLY public."ExternalNotes" DROP CONSTRAINT "ExternalNotes_pkey";
       public            postgres    false    223            �           2606    24763 (   PollingCandidates PollingCandidates_pkey 
   CONSTRAINT     |   ALTER TABLE ONLY public."PollingCandidates"
    ADD CONSTRAINT "PollingCandidates_pkey" PRIMARY KEY (polling_candidate_id);
 V   ALTER TABLE ONLY public."PollingCandidates" DROP CONSTRAINT "PollingCandidates_pkey";
       public            postgres    false    233            �           2606    16438    PollingNotes PollingNotes_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public."PollingNotes"
    ADD CONSTRAINT "PollingNotes_pkey" PRIMARY KEY (polling_notes_id);
 L   ALTER TABLE ONLY public."PollingNotes" DROP CONSTRAINT "PollingNotes_pkey";
       public            postgres    false    219            �           2606    16402 *   PollingOrderMember PollingOrderMember_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public."PollingOrderMember"
    ADD CONSTRAINT "PollingOrderMember_pkey" PRIMARY KEY (polling_order_member_id);
 X   ALTER TABLE ONLY public."PollingOrderMember" DROP CONSTRAINT "PollingOrderMember_pkey";
       public            postgres    false    210            �           2606    16488    PollingOrder PollingOrder_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public."PollingOrder"
    ADD CONSTRAINT "PollingOrder_pkey" PRIMARY KEY (polling_order_id);
 L   ALTER TABLE ONLY public."PollingOrder" DROP CONSTRAINT "PollingOrder_pkey";
       public            postgres    false    225            �           2606    16414    Polling Polling_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public."Polling"
    ADD CONSTRAINT "Polling_pkey" PRIMARY KEY (polling_id);
 B   ALTER TABLE ONLY public."Polling" DROP CONSTRAINT "Polling_pkey";
       public            postgres    false    212            �           1259    16450    fki_candidate_id    INDEX     S   CREATE INDEX fki_candidate_id ON public."PollingNotes" USING btree (candidate_id);
 $   DROP INDEX public.fki_candidate_id;
       public            postgres    false    219            �           1259    16444    fki_polling_id    INDEX     O   CREATE INDEX fki_polling_id ON public."PollingNotes" USING btree (polling_id);
 "   DROP INDEX public.fki_polling_id;
       public            postgres    false    219            �           1259    16502    fki_polling_order_id    INDEX     a   CREATE INDEX fki_polling_order_id ON public."PollingOrderMember" USING btree (polling_order_id);
 (   DROP INDEX public.fki_polling_order_id;
       public            postgres    false    210            �           1259    16456 	   fki_ws_id    INDEX     P   CREATE INDEX fki_ws_id ON public."PollingNotes" USING btree (polling_order_id);
    DROP INDEX public.fki_ws_id;
       public            postgres    false    219            �           2606    16445    PollingNotes candidate_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."PollingNotes"
    ADD CONSTRAINT candidate_id FOREIGN KEY (candidate_id) REFERENCES public."Candidate"(candidate_id) NOT VALID;
 E   ALTER TABLE ONLY public."PollingNotes" DROP CONSTRAINT candidate_id;
       public          postgres    false    3219    214    219            �           2606    16470    ExternalNotes candidate_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."ExternalNotes"
    ADD CONSTRAINT candidate_id FOREIGN KEY (candidate_id) REFERENCES public."Candidate"(candidate_id) NOT VALID;
 F   ALTER TABLE ONLY public."ExternalNotes" DROP CONSTRAINT candidate_id;
       public          postgres    false    214    3219    223            �           2606    16439    PollingNotes polling_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."PollingNotes"
    ADD CONSTRAINT polling_id FOREIGN KEY (polling_id) REFERENCES public."Polling"(polling_id) NOT VALID;
 C   ALTER TABLE ONLY public."PollingNotes" DROP CONSTRAINT polling_id;
       public          postgres    false    212    3217    219            �           2606    16475    ExternalNotes polling_order_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."ExternalNotes"
    ADD CONSTRAINT polling_order_id FOREIGN KEY (polling_order_member_id) REFERENCES public."PollingOrderMember"(polling_order_member_id) NOT VALID;
 J   ALTER TABLE ONLY public."ExternalNotes" DROP CONSTRAINT polling_order_id;
       public          postgres    false    223    3214    210            �           2606    16512    Polling polling_order_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."Polling"
    ADD CONSTRAINT polling_order_id FOREIGN KEY (polling_order_id) REFERENCES public."PollingOrder"(polling_order_id) NOT VALID;
 D   ALTER TABLE ONLY public."Polling" DROP CONSTRAINT polling_order_id;
       public          postgres    false    225    212    3228            �           2606    16525    Candidate polling_order_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT polling_order_id FOREIGN KEY (polling_order_id) REFERENCES public."PollingOrder"(polling_order_id) NOT VALID;
 F   ALTER TABLE ONLY public."Candidate" DROP CONSTRAINT polling_order_id;
       public          postgres    false    214    3228    225            5   5   x�3�t��-H-I�+QpN�K�LI,I�4�2�&�`@Y��� ������ .��      >      x������ � �      3   ,   x�3�tK��Q�����K�4202�54�50�3�9�b���� ��	u      H      x�3�4�4�2�4�4�&��\1z\\\ !��      :   :   x�3��K-O/�T�,VH��O���4BCN###]K]C#+��q��qqq �=�      @      x�3���,IUNN,J�4�4����� L�q      1   �  x�m�Ms�0���+\��&APwE�
��ʅ�&ZDĘ� }�����s�̜�s��	=��I���K�R"uѦA�m�P��|�́�21m��� .��$O$d�̝�ڲtǮ#A	�z`ԃPz�#k#�O�Y�v����A�W�k(d���m�mn,��E<�Z�c��?�F�̀C빶�n�.����P�o�n��a��94��/�'���$�`�:ךᙨ
^��&��i��,���a�Y-o[�_<(y����8<'BГD0�ւ�}�! �������3t��l]�~ek�4�T���mP����*��n�t�@c1i�U��3�< �$��8�<���~�N��L3f�{n�N����Y�s?�Ϲ�ڈ���o髹�u���)QdY~[
�y     