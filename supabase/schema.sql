-- ============================================================
-- Ministério de Multimídia — schema completo
-- Rode este arquivo inteiro no SQL Editor do Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabelas base
-- ------------------------------------------------------------

create table if not exists papeis (
  id    text primary key,
  nome  text not null
);

create table if not exists permissoes (
  id    text primary key,
  nome  text not null
);

create table if not exists papel_permissoes (
  papel_id      text references papeis(id) on delete cascade,
  permissao_id  text references permissoes(id) on delete cascade,
  primary key (papel_id, permissao_id)
);

create table if not exists funcoes (
  id     text primary key,
  nome   text not null,
  cor    text not null default '#6B7280',
  ordem  int  not null default 0
);

-- Perfil de cada pessoa. O id é o mesmo do auth.users.
create table if not exists perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  email      text not null,
  telefone   text,
  foto_url   text,
  papel_id   text not null references papeis(id) default 'voluntario',
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create table if not exists perfil_funcoes (
  perfil_id  uuid references perfis(id) on delete cascade,
  funcao_id  text references funcoes(id) on delete cascade,
  primary key (perfil_id, funcao_id)
);

create table if not exists inscricoes (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  idade           int,
  telefone        text not null,
  email           text not null,
  foto_url        text,
  funcoes         text[] not null default '{}',
  experiencia     text,
  disponibilidade text,
  status          text not null default 'pendente'
                  check (status in ('pendente','aprovado','recusado')),
  criado_em       timestamptz not null default now(),
  decidido_por    uuid references perfis(id),
  decidido_em     timestamptz
);

create table if not exists eventos (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  data       date not null,
  hora       time not null,
  criado_em  timestamptz not null default now()
);

create table if not exists escalacoes (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references eventos(id) on delete cascade,
  funcao_id  text not null references funcoes(id) on delete cascade,
  perfil_id  uuid references perfis(id) on delete set null,
  status     text not null default 'aguardando'
             check (status in ('aguardando','confirmado','recusado')),
  unique (evento_id, funcao_id)
);

create table if not exists indisponibilidades (
  id         uuid primary key default gen_random_uuid(),
  perfil_id  uuid not null references perfis(id) on delete cascade,
  data       date not null,
  motivo     text,
  unique (perfil_id, data)
);

-- Registro de tudo que o sistema disparou.
create table if not exists notificacoes (
  id            uuid primary key default gen_random_uuid(),
  inscricao_id  uuid references inscricoes(id) on delete set null,
  perfil_id     uuid references perfis(id) on delete set null,
  canal         text not null check (canal in ('email','whatsapp')),
  tipo          text not null,
  destino       text not null,
  conteudo      text not null,
  status        text not null default 'pendente'
                check (status in ('pendente','enviado','erro')),
  erro          text,
  criado_em     timestamptz not null default now()
);

create index if not exists idx_inscricoes_status on inscricoes(status, criado_em desc);
create index if not exists idx_escalacoes_evento on escalacoes(evento_id);
create index if not exists idx_eventos_data on eventos(data);

-- ------------------------------------------------------------
-- Dados iniciais
-- ------------------------------------------------------------

insert into papeis (id, nome) values
  ('lider','Líder'), ('escalador','Escalador'), ('voluntario','Voluntário')
on conflict (id) do nothing;

insert into permissoes (id, nome) values
  ('inscricoes:ver',      'Ver inscrições'),
  ('inscricoes:aprovar',  'Aprovar ou recusar inscrições'),
  ('escalas:ver',         'Ver escalas'),
  ('escalas:editar',      'Montar e alterar escalas'),
  ('membros:ver',         'Ver membros'),
  ('membros:editar',      'Editar dados de membros'),
  ('acessos:gerenciar',   'Gerenciar papéis e acessos')
on conflict (id) do nothing;

insert into papel_permissoes (papel_id, permissao_id)
select 'lider', id from permissoes
on conflict do nothing;

insert into papel_permissoes (papel_id, permissao_id) values
  ('escalador','escalas:ver'), ('escalador','escalas:editar'),
  ('escalador','membros:ver'), ('escalador','inscricoes:ver'),
  ('voluntario','escalas:ver')
on conflict do nothing;

insert into funcoes (id, nome, cor, ordem) values
  ('cam',   'Câmera',           '#2E6BFF', 1),
  ('corte', 'Corte / switcher', '#FF3B2F', 2),
  ('proj',  'Projeção',         '#8B5CF6', 3),
  ('som',   'Som',              '#16A46B', 4),
  ('live',  'Transmissão',      '#F79009', 5),
  ('foto',  'Fotografia',       '#EC4899', 6)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Função de permissão (usada por todas as políticas)
-- security definer para poder ler as tabelas de papel sem recursão de RLS
-- ------------------------------------------------------------

create or replace function tem_permissao(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from perfis p
    join papel_permissoes pp on pp.papel_id = p.papel_id
    where p.id = auth.uid()
      and p.ativo
      and pp.permissao_id = perm
  );
$$;

revoke all on function tem_permissao(text) from public;
grant execute on function tem_permissao(text) to authenticated;

-- ------------------------------------------------------------
-- RLS
-- Ninguém anônimo lê nada. O formulário público grava pela API
-- do servidor, com a service role, nunca direto do navegador.
-- ------------------------------------------------------------

alter table perfis              enable row level security;
alter table perfil_funcoes      enable row level security;
alter table papeis              enable row level security;
alter table permissoes          enable row level security;
alter table papel_permissoes    enable row level security;
alter table funcoes             enable row level security;
alter table inscricoes          enable row level security;
alter table eventos             enable row level security;
alter table escalacoes          enable row level security;
alter table indisponibilidades  enable row level security;
alter table notificacoes        enable row level security;

-- Tabelas de referência: qualquer pessoa logada lê
create policy leitura_papeis      on papeis           for select to authenticated using (true);
create policy leitura_permissoes  on permissoes       for select to authenticated using (true);
create policy leitura_pp          on papel_permissoes for select to authenticated using (true);
create policy leitura_funcoes     on funcoes          for select to authenticated using (true);

-- Só quem gerencia acessos altera a matriz de permissões
create policy escrita_pp on papel_permissoes for all to authenticated
  using (tem_permissao('acessos:gerenciar'))
  with check (tem_permissao('acessos:gerenciar'));

-- Perfis
create policy perfil_proprio on perfis for select to authenticated
  using (id = auth.uid());

create policy perfis_equipe on perfis for select to authenticated
  using (tem_permissao('membros:ver'));

-- Cada pessoa edita o próprio cadastro, mas não o próprio papel
create policy perfil_editar_proprio on perfis for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and papel_id = (select papel_id from perfis where id = auth.uid()));

create policy perfil_editar_equipe on perfis for update to authenticated
  using (tem_permissao('membros:editar'))
  with check (tem_permissao('membros:editar'));

-- Funções de cada pessoa
create policy pf_ver on perfil_funcoes for select to authenticated
  using (perfil_id = auth.uid() or tem_permissao('membros:ver'));

create policy pf_editar on perfil_funcoes for all to authenticated
  using (tem_permissao('membros:editar'))
  with check (tem_permissao('membros:editar'));

-- Inscrições
create policy inscricoes_ver on inscricoes for select to authenticated
  using (tem_permissao('inscricoes:ver'));

create policy inscricoes_decidir on inscricoes for update to authenticated
  using (tem_permissao('inscricoes:aprovar'))
  with check (tem_permissao('inscricoes:aprovar'));

-- Eventos e escalas
create policy eventos_ver on eventos for select to authenticated
  using (tem_permissao('escalas:ver'));

create policy eventos_editar on eventos for all to authenticated
  using (tem_permissao('escalas:editar'))
  with check (tem_permissao('escalas:editar'));

create policy escalacoes_ver on escalacoes for select to authenticated
  using (tem_permissao('escalas:ver'));

create policy escalacoes_editar on escalacoes for all to authenticated
  using (tem_permissao('escalas:editar'))
  with check (tem_permissao('escalas:editar'));

-- A pessoa escalada confirma a própria escala
create policy escalacao_confirmar on escalacoes for update to authenticated
  using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());

-- Indisponibilidade: cada um marca a sua; quem escala enxerga todas
create policy indisp_propria on indisponibilidades for all to authenticated
  using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());

create policy indisp_ver_equipe on indisponibilidades for select to authenticated
  using (tem_permissao('escalas:editar'));

-- Notificações: leitura para quem cuida de inscrições. Escrita só pela service role.
create policy notif_ver on notificacoes for select to authenticated
  using (tem_permissao('inscricoes:ver'));

-- ------------------------------------------------------------
-- Storage: fotos de perfil
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatar_leitura on storage.objects for select
  using (bucket_id = 'avatars');

-- Cada pessoa grava só na própria pasta: avatars/<uid>/arquivo.jpg
create policy avatar_upload_proprio on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatar_update_proprio on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatar_admin on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and tem_permissao('membros:editar'))
  with check (bucket_id = 'avatars' and tem_permissao('membros:editar'));

-- ------------------------------------------------------------
-- Depois de criar seu usuário pelo painel do Supabase
-- (Authentication > Users > Add user), rode isto trocando o e-mail:
--
--   insert into perfis (id, nome, email, papel_id)
--   select id, 'Seu Nome', email, 'lider' from auth.users
--   where email = 'voce@suaigreja.com'
--   on conflict (id) do update set papel_id = 'lider';
-- ------------------------------------------------------------
