# Respawn — conexão com Supabase

O projeto já está configurado para usar o Supabase informado. O arquivo `supabase-config.js` contém a URL e a chave pública (publishable) do projeto.

## 1. Preparar o banco de dados

1. Entre no painel do projeto Supabase.
2. Abra **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo `supabase-schema.sql`, copie todo o conteúdo e cole no editor.
5. Clique em **Run** e aguarde a conclusão sem erros.

O SQL cria as tabelas, políticas de segurança (RLS), gatilho de criação automática de perfil, função para excluir a própria conta e cadastra as seis matérias de demonstração do Respawn. O script também pode ser executado novamente sem duplicar as políticas e as matérias iniciais.

## 2. Ativar confirmação de e-mail

No painel, entre em **Authentication → Providers → Email** e confira se o provedor Email está habilitado. Se a confirmação de e-mail estiver ligada, após criar a conta o usuário deverá abrir o e-mail recebido e confirmar o cadastro antes de entrar.

Em **Authentication → URL Configuration**, configure a URL do site e as URLs de redirecionamento que serão usadas no projeto. Durante o desenvolvimento local, inclua o endereço local utilizado pelo servidor de desenvolvimento.

## 3. Executar o site

Não abra o `index(3).html` diretamente pelo caminho `file://`. Use o Live Server do VS Code ou outro servidor local. Abra a pasta do projeto no VS Code, clique com o botão direito em `index(3).html` e escolha **Open with Live Server**.

## 4. O que já está conectado no código

- Cadastro com e-mail e senha pelo Supabase Auth.
- Login e encerramento de sessão.
- Perfil com nome, bio, plataforma e avatar; preferências privadas separadas do perfil público.
- Alteração de senha.
- Exclusão da própria conta e dados relacionados.
- Comentários persistidos no banco.
- Curtidas persistidas no banco e sincronizadas entre usuários.
- Formulário de contato e inscrições na newsletter.

As notícias e o catálogo de jogos continuam vindo dos arquivos locais `data.js`; o SQL também registra as seis matérias iniciais no banco para associar comentários e curtidas. O painel administrativo para publicar novas matérias e a recuperação de senha por e-mail ainda não foram implementados.

## Segurança

A chave `sb_publishable_...` é própria para o navegador e pode aparecer no código do front-end. **Nunca coloque uma chave `service_role` ou segredo administrativo em `supabase-config.js`, HTML ou JavaScript.** As permissões de acesso são controladas pelas políticas RLS do SQL.
