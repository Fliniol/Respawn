
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  bio text not null default '',
  favorite_platform text not null default 'PC',
  avatar_url text,
  role text not null default 'reader' check (role in ('reader', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  newsletter_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  body jsonb not null default '[]'::jsonb,
  category text not null check (category in ('noticia', 'guia', 'lancamento', 'analise')),
  cover_image_url text,
  author_id uuid references public.profiles(id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.article_likes (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists comments_article_created_idx on public.comments(article_id, created_at desc);
create index if not exists articles_published_idx on public.articles(published, published_at desc);

alter table public.profiles enable row level security;
alter table public.profile_settings enable row level security;
alter table public.articles enable row level security;
alter table public.comments enable row level security;
alter table public.article_likes enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Somente a administração pode alterar o nível de acesso.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
before update on public.profiles
for each row execute function public.protect_profile_role();

drop policy if exists "Perfis públicos para leitura" on public.profiles;
create policy "Perfis públicos para leitura" on public.profiles
  for select using (true);
drop policy if exists "Usuário cria seu perfil" on public.profiles;
create policy "Usuário cria seu perfil" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Usuário altera seu perfil" on public.profiles;
create policy "Usuário altera seu perfil" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Usuário lê suas preferências" on public.profile_settings;
create policy "Usuário lê suas preferências" on public.profile_settings
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Usuário cria suas preferências" on public.profile_settings;
create policy "Usuário cria suas preferências" on public.profile_settings
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Usuário altera suas preferências" on public.profile_settings;
create policy "Usuário altera suas preferências" on public.profile_settings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Leitura de matérias publicadas" on public.articles;
create policy "Leitura de matérias publicadas" on public.articles
  for select using (published = true);
drop policy if exists "Editor gerencia matérias" on public.articles;
create policy "Editor gerencia matérias" on public.articles
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor','admin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor','admin')));

drop policy if exists "Leitura pública de comentários" on public.comments;
create policy "Leitura pública de comentários" on public.comments
  for select using (true);
drop policy if exists "Usuário autenticado comenta" on public.comments;
create policy "Usuário autenticado comenta" on public.comments
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Autor exclui próprio comentário" on public.comments;
create policy "Autor exclui próprio comentário" on public.comments
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Leitura pública de curtidas" on public.article_likes;
create policy "Leitura pública de curtidas" on public.article_likes
  for select using (true);
drop policy if exists "Usuário registra própria curtida" on public.article_likes;
create policy "Usuário registra própria curtida" on public.article_likes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Usuário remove própria curtida" on public.article_likes;
create policy "Usuário remove própria curtida" on public.article_likes
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Inscrição na newsletter" on public.newsletter_subscribers;
create policy "Inscrição na newsletter" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);
drop policy if exists "Envio de contato" on public.contact_messages;
create policy "Envio de contato" on public.contact_messages
  for insert to anon, authenticated with check (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nome_exibicao text;
begin
  nome_exibicao := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1));
  if char_length(nome_exibicao) < 2 then
    nome_exibicao := 'Jogador';
  end if;
  insert into public.profiles (id, display_name)
  values (new.id, nome_exibicao)
  on conflict (id) do nothing;
  insert into public.profile_settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profile_settings to authenticated;

revoke all on public.profiles from anon, authenticated;
grant select (id, display_name, bio, favorite_platform, avatar_url, created_at, updated_at)
  on public.profiles to anon, authenticated;
grant insert (id, display_name, bio, favorite_platform, avatar_url)
  on public.profiles to authenticated;
grant update (display_name, bio, favorite_platform, avatar_url, updated_at)
  on public.profiles to authenticated;

grant select on public.articles to anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (article_id, user_id, content) on public.comments to authenticated;
grant delete on public.comments to authenticated;
grant select on public.article_likes to anon, authenticated;
grant insert (article_id, user_id) on public.article_likes to authenticated;
grant delete on public.article_likes to authenticated;
grant insert (email) on public.newsletter_subscribers to anon, authenticated;
grant insert (name, email, subject, message) on public.contact_messages to anon, authenticated;

insert into public.articles (slug, title, excerpt, body, category, cover_image_url, published, published_at) values
('a1', 'Estúdio independente cearense anuncia RPG tático ambientado no sertão', 'Produção nacional mistura mecânicas de turnos com narrativa histórica sobre a seca de 1877.', '["Desenvolvido em Fortaleza por uma equipe de 14 pessoas, ''Sol de Ferro'' aposta em combates táticos em grade inspirados nos clássicos do gênero, mas com identidade visual e trilha sonora baseadas na cultura nordestina.", "O jogador lidera uma caravana em busca de água e abrigo, precisando gerenciar suprimentos, moral do grupo e alianças políticas entre vilarejos isolados.", "Uma demonstração gratuita estará disponível para PC durante a próxima feira brasileira de jogos independentes."]'::jsonb, 'noticia', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', true, now()),
('a2', 'Guia completo: todos os finais secretos do último capítulo', 'Mapeamos as seis rotas alternativas e o que cada escolha desbloqueia no New Game+.', '["Para liberar o sexto final verdadeiro, não basta derrotar o chefe final: você precisa concluir as três missões secundárias do Observatório antes do eclipse lunar.", "Confira no nosso roteiro a ordem exata dos diálogos que mantêm a lealdade da capitã intacta até o ato final."]'::jsonb, 'guia', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', true, now()),
('a3', 'Data de lançamento confirmada para outubro, com edição física limitada', 'Pré-venda abre na próxima semana com artbook impresso e trilha sonora em vinil.', '["A publicadora confirmou que o lançamento mundial ocorre em 18 de outubro para PC, PlayStation 5 e Xbox Series X|S.", "A edição de colecionador terá tiragem numerada e incluirá código para a primeira expansão de história."]'::jsonb, 'lancamento', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=900&q=80', true, now()),
('a4', 'Patch corrige bug que travava conquistas em 15% das partidas', 'Desenvolvedora confirma que save games afetados poderão ser recuperados automaticamente.', '["A atualização 1.04 já está disponível para download e verifica o progresso acumulado assim que o jogador carrega seu arquivo salvo.", "Além das conquistas, o patch melhora a estabilidade de quadros em áreas com muita névoa volumétrica."]'::jsonb, 'noticia', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=900&q=80', true, now()),
('a5', 'Como montar a build mais eficiente para o modo pesadelo', 'Testamos 12 combinações de habilidades e equipamentos — essas quatro dominaram o endgame.', '["No modo pesadelo, priorizar regeneração de energia e esquiva perfeita supera qualquer investimento bruto em armadura pesada.", "Combine o amuleto de cristal com a lâmina leve para aplicar sangramento contínuo nos chefes."]'::jsonb, 'guia', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80', true, now()),
('a6', 'Expansão gratuita chega em dezembro com novo bioma jogável', 'Conteúdo inclui três chefes inéditos, novas armas e sistema de clima dinâmico.', '["Ambientada nas ruínas submersas do norte, a expansão adiciona cerca de 8 horas inéditas de campanha sem custo adicional para quem possui o jogo base."]'::jsonb, 'lancamento', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80', true, now())
on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, category=excluded.category, cover_image_url=excluded.cover_image_url, published=true;
