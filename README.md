# Respawn

Portal de games feito com HTML, CSS e JavaScript, com autenticação e recursos de comunidade usando Supabase.

## Sobre

O Respawn reúne notícias, guias, lançamentos, análises e um catálogo de jogos. Pessoas cadastradas podem personalizar o perfil, comentar nas matérias e curtir publicações.

> Projeto acadêmico e demonstrativo. Parte do conteúdo editorial e do catálogo é fictícia e serve para apresentar as funcionalidades da interface.

## Tecnologias

- HTML5 e CSS3
- JavaScript puro (Vanilla JS)
- Supabase Auth para cadastro, login e sessão
- PostgreSQL no Supabase para perfis, comentários e curtidas
- Supabase JavaScript Client v2 via CDN

## Funcionalidades

- Layout responsivo para desktop e dispositivos móveis
- Busca e filtros de notícias e jogos
- Cadastro com confirmação de e-mail (conforme configuração do Supabase)
- Login e encerramento de sessão
- Perfil com nome de exibição, biografia, avatar e plataforma favorita
- Comentários e curtidas vinculados à conta
- Formulário de contato e inscrição na newsletter
- Opções de privacidade e exclusão da conta

## Executar localmente

1. Clone o repositório ou baixe os arquivos.
2. Abra a pasta no Visual Studio Code.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.
5. Não abra o arquivo diretamente por `file://`; use um servidor local HTTP.

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/).
2. Copie a Project URL e a chave publicável (`sb_publishable_...`) em `supabase-config.js`.
3. No painel do Supabase, abra **SQL Editor**.
4. Execute o conteúdo de `supabase-schema.sql`.
5. Se for usar os dados de exemplo, confira `respawn-seed.sql` e execute-o depois do schema.
6. Em **Authentication → URL Configuration**, adicione a URL do Live Server e o domínio de produção, quando houver.
7. Em **Authentication → Providers → Email**, confira as opções de confirmação de e-mail.

Consulte `CONFIGURAR_SUPABASE.md` para mais detalhes.

## Estrutura

```text
Respawn/
├── index.html
├── style.css
├── app.js
├── data.js
├── supabase-config.js
├── supabase-schema.sql
├── respawn-seed.sql
├── CONFIGURAR_SUPABASE.md
└── README.md
```

## Segurança

- A chave `sb_publishable` é própria para uso no navegador e pode aparecer no repositório.
- Nunca publique a chave `service_role`, tokens administrativos, senhas ou arquivos `.env` com segredos.
- Mantenha o Row Level Security (RLS) ativo e revise as políticas antes de colocar o site em produção.
- Configure corretamente as URLs de autenticação no painel do Supabase.
- Revise a política de privacidade, os termos e os processos de exclusão antes de disponibilizar o portal publicamente.

## Limitações atuais

- Notícias, análises e catálogo são carregados de `data.js`; não existe painel editorial para gerenciar esse conteúdo.
- O formulário de contato e a newsletter dependem das tabelas e políticas do banco.
- Recursos como recuperação de senha e moderação administrativa podem ser adicionados em versões futuras.

## Próximas melhorias

- Criar painel administrativo para notícias, jogos e análises.
- Implementar recuperação de senha por e-mail.
- Adicionar paginação e ferramentas de moderação.
- Criar testes automatizados e melhorar o tratamento de erros.
- Publicar em uma hospedagem estática e configurar o domínio no Supabase.

## Licença

Nenhuma licença foi definida até o momento.
