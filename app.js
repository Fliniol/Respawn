(function () {
  const supabase = window.supabase.createClient(
    window.RESPAWN_SUPABASE_URL,
    window.RESPAWN_SUPABASE_KEY
  );

  let filtroAtivo = 'todas';
  let filtroPlataforma = 'todas';
  let termoBusca = '';
  let artigoAbertoId = null;
  let usuarioAuth = null;
  let perfilAtual = null;
  let artigoDbIds = new Map();
  let curtidasUsuario = new Set();
  let totalCurtidas = new Map();
  const AVATAR_PADRAO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

  const $ = (id) => document.getElementById(id);
  const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const mostrarToast = (msg) => {
    const toast = $('toast');
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(mostrarToast.timer);
    mostrarToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  };
  const abrirModal = (id) => { $(id).hidden = false; };
  const fecharModal = (id) => { $(id).hidden = true; };
  const rotuloCategoria = (cat) => ({ noticia: 'Notícia', guia: 'Guia', lancamento: 'Lançamento', analise: 'Análise' }[cat] || cat);
  const getUsuarioLogado = () => usuarioAuth ? ({
    id: usuarioAuth.id,
    email: usuarioAuth.email,
    nome: perfilAtual?.display_name || usuarioAuth.email?.split('@')[0] || 'Jogador',
    bio: perfilAtual?.bio || '',
    plataforma: perfilAtual?.favorite_platform || 'PC',
    avatar: perfilAtual?.avatar_url || AVATAR_PADRAO,
    newsletter: Boolean(perfilAtual?.newsletter_opt_in)
  }) : null;

  async function carregarPerfil(user) {
    if (!user) { perfilAtual = null; return; }
    const [{ data, error }, settingsResult] = await Promise.all([
      supabase.from('profiles').select('id, display_name, bio, favorite_platform, avatar_url').eq('id', user.id).maybeSingle(),
      supabase.from('profile_settings').select('newsletter_opt_in').eq('user_id', user.id).maybeSingle()
    ]);
    if (error) console.error('Erro ao carregar perfil:', error.message);
    let profileData = data;
    if (!profileData) {
      const nomeFallback = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Jogador';
      const fallbackProfile = { id: user.id, display_name: nomeFallback.length >= 2 ? nomeFallback : 'Jogador' };
      const created = await supabase.from('profiles').upsert(fallbackProfile, { onConflict: 'id' }).select('id, display_name, bio, favorite_platform, avatar_url').single();
      if (created.error) console.error('Erro ao criar perfil inicial:', created.error.message);
      profileData = created.data || { ...fallbackProfile, bio: '', favorite_platform: 'PC', avatar_url: AVATAR_PADRAO };
    }
    if (settingsResult.error) console.error('Erro ao carregar preferências:', settingsResult.error.message);
    perfilAtual = { ...profileData, newsletter_opt_in: Boolean(settingsResult.data?.newsletter_opt_in) };
  }

  async function atualizarEstadoAuth(session) {
    usuarioAuth = session?.user || null;
    await carregarPerfil(usuarioAuth);
    await carregarCurtidas();
    atualizarHeaderUsuario();
    renderTudo();
    if (artigoAbertoId && !$('modalArtigo').hidden) await renderComentarios(artigoAbertoId);
  }

  function atualizarHeaderUsuario() {
    const user = getUsuarioLogado();
    $('authButtons').hidden = Boolean(user);
    $('userMenu').hidden = !user;
    if (user) {
      $('headerUserName').textContent = user.nome;
      $('headerAvatar').src = user.avatar;
    }
  }

  function getLikesUsuario() { return [...curtidasUsuario]; }
  function totalCurtidasArtigo(artigo) { return (Number(artigo.curtidas) || 0) + (totalCurtidas.get(artigo.id) || 0); }

  async function carregarArtigosDoBanco() {
    const { data, error } = await supabase.from('articles').select('id, slug').eq('published', true);
    if (error) { console.error('Não foi possível carregar os artigos do banco:', error.message); return; }
    artigoDbIds = new Map((data || []).map(item => [item.slug, item.id]));
  }

  async function carregarCurtidas() {
    const { data, error } = await supabase.from('article_likes').select('article_id, user_id');
    if (error) { console.error('Erro ao carregar curtidas:', error.message); return; }
    totalCurtidas = new Map();
    curtidasUsuario = new Set();
    (data || []).forEach((like) => {
      const slug = [...artigoDbIds.entries()].find(([, uuid]) => uuid === like.article_id)?.[0];
      if (slug) totalCurtidas.set(slug, (totalCurtidas.get(slug) || 0) + 1);
      if (usuarioAuth && like.user_id === usuarioAuth.id && slug) curtidasUsuario.add(slug);
    });
  }

  async function alternarCurtida(artigoId) {
    const user = getUsuarioLogado();
    if (!user) {
      mostrarToast('Entre na sua conta para curtir uma matéria.');
      abrirAuthModal('login');
      return;
    }
    const dbId = artigoDbIds.get(artigoId);
    if (!dbId) { mostrarToast('Esta matéria ainda não foi cadastrada no banco. Execute o SQL de configuração.'); return; }
    let result;
    if (curtidasUsuario.has(artigoId)) {
      result = await supabase.from('article_likes').delete().eq('article_id', dbId).eq('user_id', user.id);
    } else {
      result = await supabase.from('article_likes').insert({ article_id: dbId, user_id: user.id });
    }
    if (result.error) { mostrarToast('Não foi possível atualizar a curtida.'); console.error(result.error); return; }
    await carregarCurtidas();
    renderTudo();
    if (artigoAbertoId === artigoId) await abrirArtigo(artigoId);
  }

  function renderHero() {
    const destaque = ARTIGOS.find(a => a.destaque) || ARTIGOS[0];
    $('heroSection').innerHTML = `
      <div class="wrap hero-inner">
        <div class="hero-text">
          <span class="section-kicker">${escapeHTML(rotuloCategoria(destaque.categoria))} em destaque</span>
          <h1 class="hero-title" data-open-artigo="${escapeHTML(destaque.id)}">${escapeHTML(destaque.titulo)}</h1>
          <p class="hero-dek">${escapeHTML(destaque.excerpt)}</p>
          <div class="hero-meta"><span>Por ${escapeHTML(destaque.autor)}</span><span>•</span><span>${escapeHTML(destaque.tempo)}</span><span>•</span><span>${totalCurtidasArtigo(destaque)} curtidas</span></div>
          <div class="hero-cta"><button type="button" class="btn btn-primary" data-open-artigo="${escapeHTML(destaque.id)}">Ler matéria</button></div>
        </div>
        <div class="hero-figure" data-open-artigo="${escapeHTML(destaque.id)}"><img src="${escapeHTML(destaque.imagem)}" alt="${escapeHTML(destaque.titulo)}"></div>
      </div>`;
  }

  function renderMelhores() {
    const likesUser = getLikesUsuario();
    const melhores = [...ARTIGOS].sort((a, b) => totalCurtidasArtigo(b) - totalCurtidasArtigo(a)).slice(0, 3);
    $('melhoresGrid').innerHTML = melhores.map((a, idx) => `
      <article class="melhor-card">
        <div class="melhor-img-wrap" data-open-artigo="${escapeHTML(a.id)}"><span class="rank-badge">#${idx + 1} em curtidas</span><img src="${escapeHTML(a.imagem)}" alt="${escapeHTML(a.titulo)}"></div>
        <div class="melhor-body"><span class="feed-tag">${escapeHTML(rotuloCategoria(a.categoria))}</span><h3 data-open-artigo="${escapeHTML(a.id)}">${escapeHTML(a.titulo)}</h3><p class="feed-excerpt">${escapeHTML(a.excerpt)}</p>
        <div class="card-footer"><span>${escapeHTML(a.tempo)}</span><div class="card-actions"><button type="button" class="like-btn ${likesUser.includes(a.id) ? 'is-liked' : ''}" data-like-id="${escapeHTML(a.id)}">♥ ${totalCurtidasArtigo(a)}</button><button type="button" class="ler-btn" data-open-artigo="${escapeHTML(a.id)}">Ler →</button></div></div></div>
      </article>`).join('');
  }

  function renderFeed() {
    const likesUser = getLikesUsuario();
    let lista = filtroAtivo === 'todas' ? ARTIGOS : ARTIGOS.filter(a => a.categoria === filtroAtivo);
    if (termoBusca.trim()) {
      const t = termoBusca.toLowerCase();
      lista = lista.filter(a => a.titulo.toLowerCase().includes(t) || a.excerpt.toLowerCase().includes(t));
    }
    $('feedEmpty').hidden = Boolean(lista.length);
    $('feedGrid').innerHTML = lista.map(a => `
      <article class="feed-item"><div class="feed-figure" data-open-artigo="${escapeHTML(a.id)}"><img src="${escapeHTML(a.imagem)}" alt="${escapeHTML(a.titulo)}"></div>
      <span class="feed-tag ${a.categoria === 'lancamento' ? 'is-lancamento' : ''}">${escapeHTML(rotuloCategoria(a.categoria))}</span>
      <p class="feed-titulo" data-open-artigo="${escapeHTML(a.id)}">${escapeHTML(a.titulo)}</p><p class="feed-excerpt">${escapeHTML(a.excerpt)}</p>
      <div class="card-footer"><span>${escapeHTML(a.tempo)}</span><div class="card-actions"><button type="button" class="like-btn ${likesUser.includes(a.id) ? 'is-liked' : ''}" data-like-id="${escapeHTML(a.id)}">♥ ${totalCurtidasArtigo(a)}</button><button type="button" class="ler-btn" data-open-artigo="${escapeHTML(a.id)}">Ler e comentar</button></div></div></article>`).join('');
  }

  function renderCatalogo() {
    let lista = filtroPlataforma === 'todas' ? CATALOGO_JOGOS : CATALOGO_JOGOS.filter(j => j.plataformas.includes(filtroPlataforma));
    if (termoBusca.trim()) {
      const t = termoBusca.toLowerCase();
      lista = lista.filter(j => j.titulo.toLowerCase().includes(t) || j.genero.toLowerCase().includes(t));
    }
    $('catalogoGrid').innerHTML = lista.map(j => `
      <article class="jogo-card"><div class="jogo-capa"><span class="jogo-nota">${Number(j.nota).toFixed(1)}</span><img src="${escapeHTML(j.capa)}" alt="${escapeHTML(j.titulo)}"></div>
      <div class="jogo-info"><span class="jogo-genero">${escapeHTML(j.genero)}</span><h3>${escapeHTML(j.titulo)}</h3><span class="jogo-plat">${j.plataformas.map(escapeHTML).join(' · ')}</span><p class="jogo-desc">${escapeHTML(j.descricao)}</p></div></article>`).join('');
  }

  function renderAnalises() {
    const classeScore = n => n >= 8.5 ? 'score-alta' : n >= 7 ? 'score-media' : 'score-baixa';
    $('analisesList').innerHTML = ANALISES.map(r => `<div class="analise-row"><span class="analise-score ${classeScore(r.nota)}">${Number(r.nota).toFixed(1)}</span><div><p class="analise-info-titulo">${escapeHTML(r.titulo)}</p><p class="analise-info-plataforma">${escapeHTML(r.plataforma)}</p></div><p class="analise-veredito">${escapeHTML(r.veredito)}</p></div>`).join('');
  }

  async function abrirArtigo(id) {
    const artigo = ARTIGOS.find(a => a.id === id);
    if (!artigo) return;
    artigoAbertoId = id;
    const curtiu = curtidasUsuario.has(id);
    $('artigoDetalhe').innerHTML = `
      <span class="section-kicker">${escapeHTML(rotuloCategoria(artigo.categoria))}</span><h2 class="artigo-full-titulo">${escapeHTML(artigo.titulo)}</h2>
      <div class="hero-meta artigo-meta"><span>Por ${escapeHTML(artigo.autor)}</span><span>•</span><span>${escapeHTML(artigo.tempo)}</span><button type="button" class="like-btn ${curtiu ? 'is-liked' : ''}" data-like-id="${escapeHTML(artigo.id)}">♥ ${totalCurtidasArtigo(artigo)} curtidas</button></div>
      <img src="${escapeHTML(artigo.imagem)}" alt="${escapeHTML(artigo.titulo)}" class="artigo-full-img"><div class="artigo-full-corpo">${artigo.conteudo.map(p => `<p>${escapeHTML(p)}</p>`).join('')}</div>`;
    const user = getUsuarioLogado();
    $('comentarioAutorInfo').textContent = user ? `Comentando como ${user.nome}` : 'Entre na sua conta para participar da conversa.';
    $('comentarioForm').querySelector('button[type="submit"]').disabled = !user;
    await renderComentarios(id);
    abrirModal('modalArtigo');
  }

  async function renderComentarios(artigoId) {
    const dbId = artigoDbIds.get(artigoId);
    const container = $('comentariosLista');
    if (!dbId) { container.innerHTML = '<p class="texto-dim">Execute o SQL de configuração para ativar os comentários desta matéria.</p>'; return; }
    const { data, error } = await supabase.from('comments')
      .select('id, content, created_at, user_id, profiles(display_name, avatar_url)')
      .eq('article_id', dbId).order('created_at', { ascending: false });
    if (error) { console.error(error); container.innerHTML = '<p class="texto-dim">Não foi possível carregar os comentários.</p>'; return; }
    const user = getUsuarioLogado();
    $('comentariosCount').textContent = data.length;
    if (!data.length) { container.innerHTML = '<p class="texto-dim">Ainda não há comentários nesta matéria.</p>'; return; }
    container.innerHTML = data.map(c => {
      const autor = c.profiles?.display_name || 'Leitor';
      const avatar = c.profiles?.avatar_url || AVATAR_PADRAO;
      const dataTexto = new Date(c.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      return `<div class="comentario-item"><div class="comentario-topo"><div class="comentario-autor"><img src="${escapeHTML(avatar)}" alt=""><span>${escapeHTML(autor)}</span><span class="texto-dim">• ${escapeHTML(dataTexto)}</span></div>${user?.id === c.user_id ? `<button type="button" class="comentario-del" data-del-comment="${escapeHTML(c.id)}">Excluir</button>` : ''}</div><p>${escapeHTML(c.content)}</p></div>`;
    }).join('');
  }

  $('comentarioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getUsuarioLogado();
    if (!user) { abrirAuthModal('login'); return; }
    const texto = $('comentarioTexto').value.trim();
    const dbId = artigoDbIds.get(artigoAbertoId);
    if (!texto || !dbId) return;
    const { error } = await supabase.from('comments').insert({ article_id: dbId, user_id: user.id, content: texto });
    if (error) { mostrarToast('Não foi possível publicar. Tente novamente.'); console.error(error); return; }
    $('comentarioTexto').value = '';
    await renderComentarios(artigoAbertoId);
    mostrarToast('Comentário publicado.');
  });

  $('comentariosLista').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-del-comment]');
    const user = getUsuarioLogado();
    if (!btn || !user) return;
    const { error } = await supabase.from('comments').delete().eq('id', btn.dataset.delComment).eq('user_id', user.id);
    if (error) { mostrarToast('Não foi possível excluir o comentário.'); console.error(error); return; }
    await renderComentarios(artigoAbertoId);
    mostrarToast('Comentário removido.');
  });

  function abrirAuthModal(modo = 'login') {
    const isLogin = modo === 'login';
    $('formLogin').hidden = !isLogin;
    $('formCadastro').hidden = isLogin;
    abrirModal('modalAuth');
  }
  $('btnAbrirLogin').addEventListener('click', () => abrirAuthModal('login'));
  $('btnAbrirCadastro').addEventListener('click', () => abrirAuthModal('cadastro'));

  $('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = $('cadNome').value.trim();
    const email = $('cadEmail').value.trim().toLowerCase();
    const senha = $('cadSenha').value;
    if (nome.length < 2 || nome.length > 40) { mostrarToast('O nome precisa ter entre 2 e 40 caracteres.'); return; }
    if (senha.length < 8) { mostrarToast('Use uma senha com pelo menos 8 caracteres.'); return; }
    const { data, error } = await supabase.auth.signUp({ email, password: senha, options: { data: { display_name: nome } } });
    if (error) { mostrarToast(error.message); return; }
    e.target.reset();
    fecharModal('modalAuth');
    if (data.session) {
      await atualizarEstadoAuth(data.session);
      mostrarToast(`Conta criada. Bem-vindo, ${nome}!`);
    } else {
      mostrarToast('Cadastro iniciado! Confira seu e-mail para confirmar a conta.');
    }
  });

  $('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('loginEmail').value.trim().toLowerCase();
    const password = $('loginSenha').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { mostrarToast('E-mail ou senha inválidos.'); return; }
    e.target.reset();
    fecharModal('modalAuth');
    await atualizarEstadoAuth(data.session);
    mostrarToast(`Bem-vindo, ${getUsuarioLogado()?.nome || 'jogador'}!`);
  });

  $('btnSair').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { mostrarToast('Não foi possível sair da conta.'); return; }
    await atualizarEstadoAuth(null);
    mostrarToast('Você saiu da sua conta.');
  });

  async function abrirModalPerfil() {
    const user = getUsuarioLogado();
    if (!user) return;
    $('perfilAvatarPreview').src = user.avatar;
    $('perfilTituloNome').textContent = user.nome;
    $('perfilEmailTexto').textContent = user.email;
    $('perfilBioTexto').textContent = user.bio;
    $('cfgNome').value = user.nome;
    $('cfgBio').value = user.bio;
    $('cfgPlataforma').value = user.plataforma;
    $('cfgAvatar').value = user.avatar;
    $('cfgNewsletter').checked = user.newsletter;

    const [commentsResult, likesResult] = await Promise.all([
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('article_likes').select('article_id', { count: 'exact', head: true }).eq('user_id', user.id)
    ]);
    $('statComentarios').textContent = commentsResult.count ?? 0;
    $('statCurtidas').textContent = likesResult.count ?? 0;
    $('statPlataforma').textContent = user.plataforma;
    document.querySelectorAll('[data-perfil-tab]').forEach(tab => tab.classList.toggle('is-active', tab.dataset.perfilTab === 'visao'));
    $('abaVisao').hidden = false;
    $('formConfigPerfil').hidden = true;
    $('abaSeguranca').hidden = true;
    abrirModal('modalPerfil');
  }
  $('btnAbrirPerfil').addEventListener('click', abrirModalPerfil);

  document.querySelectorAll('[data-perfil-tab]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('[data-perfil-tab]').forEach(t => t.classList.toggle('is-active', t === tab));
    $('abaVisao').hidden = tab.dataset.perfilTab !== 'visao';
    $('formConfigPerfil').hidden = tab.dataset.perfilTab !== 'config';
    $('abaSeguranca').hidden = tab.dataset.perfilTab !== 'seguranca';
  }));

  $('formConfigPerfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getUsuarioLogado();
    if (!user) return;
    const nomePerfil = $('cfgNome').value.trim();
    if (nomePerfil.length < 2 || nomePerfil.length > 40) { mostrarToast('O nome precisa ter entre 2 e 40 caracteres.'); return; }
    const updates = {
      display_name: nomePerfil,
      bio: $('cfgBio').value.trim(),
      favorite_platform: $('cfgPlataforma').value,
      avatar_url: $('cfgAvatar').value,
      updated_at: new Date().toISOString()
    };
    const [{ error }, settingsResult] = await Promise.all([
      supabase.from('profiles').update(updates).eq('id', user.id),
      supabase.from('profile_settings').upsert({ user_id: user.id, newsletter_opt_in: $('cfgNewsletter').checked, updated_at: new Date().toISOString() })
    ]);
    if (error || settingsResult.error) { mostrarToast('Não foi possível salvar o perfil.'); console.error(error || settingsResult.error); return; }
    perfilAtual = { ...perfilAtual, ...updates, newsletter_opt_in: $('cfgNewsletter').checked };
    atualizarHeaderUsuario();
    $('perfilTituloNome').textContent = updates.display_name;
    $('perfilBioTexto').textContent = updates.bio;
    $('perfilAvatarPreview').src = updates.avatar_url;
    mostrarToast('Perfil atualizado.');
  });

  $('formAlterarSenha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const senha = $('novaSenha').value;
    if (senha.length < 8) { mostrarToast('Use pelo menos 8 caracteres.'); return; }
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) { mostrarToast(error.message); return; }
    e.target.reset();
    mostrarToast('Senha atualizada.');
  });

  $('btnDeletarConta').addEventListener('click', async () => {
    const user = getUsuarioLogado();
    if (!user || !confirm(`Excluir permanentemente a conta de ${user.nome}? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.rpc('delete_my_account');
    if (error) { mostrarToast('Não foi possível excluir a conta. Confira se executou o SQL atualizado.'); console.error(error); return; }
    await supabase.auth.signOut();
    fecharModal('modalPerfil');
    await atualizarEstadoAuth(null);
    mostrarToast('Conta excluída.');
  });

  const TEXTOS_LEGAIS = {
    lgpd: `<span class="section-kicker">Privacidade</span><h2>Política de Privacidade</h2><div class="artigo-full-corpo legal-copy"><p>O Respawn utiliza o Supabase para autenticação e armazenamento de dados de perfil, comentários e curtidas.</p><p>O cadastro utiliza e-mail e senha; a senha é gerenciada pelo serviço de autenticação e não é armazenada diretamente pelo Respawn.</p><p>Você pode atualizar seus dados no perfil ou solicitar a exclusão da conta na área Conta & LGPD.</p><p>Antes de publicar o portal, o responsável deverá informar um canal de contato e revisar esta política para refletir a operação real do serviço.</p></div>`,
    termos: `<span class="section-kicker">Comunidade</span><h2>Termos de Uso</h2><div class="artigo-full-corpo legal-copy"><p>Não publique spam, ameaças, discurso de ódio ou conteúdo ilegal.</p><p>Os comentários são de responsabilidade de seus autores e podem ser removidos quando violarem as regras da comunidade.</p></div>`
  };

  document.addEventListener('click', (e) => {
    const artigo = e.target.closest('[data-open-artigo]');
    if (artigo) { abrirArtigo(artigo.dataset.openArtigo); return; }
    const like = e.target.closest('[data-like-id]');
    if (like) { alternarCurtida(like.dataset.likeId); return; }
    const legal = e.target.closest('[data-legal]');
    if (legal) { $('legalConteudo').innerHTML = TEXTOS_LEGAIS[legal.dataset.legal] || ''; abrirModal('modalLegal'); }
  });

  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => fecharModal(btn.dataset.close)));
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.hidden = true; }));

  const lgpdBanner = $('lgpdBanner');
  if (localStorage.getItem('respawn_lgpd_accepted_v1') !== 'true') lgpdBanner.hidden = false;
  $('btnAceitarLgpd').addEventListener('click', () => {
    localStorage.setItem('respawn_lgpd_accepted_v1', 'true');
    lgpdBanner.hidden = true;
    mostrarToast('Preferência salva.');
  });
  $('btnReabrirCookies').addEventListener('click', () => { lgpdBanner.hidden = false; });

  $('feedFiltros').addEventListener('click', (e) => {
    const btn = e.target.closest('.filtro-btn'); if (!btn) return;
    filtroAtivo = btn.dataset.filtro;
    document.querySelectorAll('#feedFiltros .filtro-btn').forEach(b => b.classList.toggle('is-active', b === btn));
    renderFeed();
  });
  $('catalogoFiltros').addEventListener('click', (e) => {
    const btn = e.target.closest('.filtro-btn'); if (!btn) return;
    filtroPlataforma = btn.dataset.plat;
    document.querySelectorAll('#catalogoFiltros .filtro-btn').forEach(b => b.classList.toggle('is-active', b === btn));
    renderCatalogo();
  });
  $('searchInput').addEventListener('input', (e) => { termoBusca = e.target.value; renderFeed(); renderCatalogo(); });

  $('newsletterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('newsletterEmail').value.trim().toLowerCase();
    const { error } = await supabase.from('newsletter_subscribers').insert({ email });
    if (error?.code === '23505') mostrarToast('Este e-mail já está cadastrado.');
    else if (error) { mostrarToast('Não foi possível concluir a inscrição.'); console.error(error); }
    else mostrarToast('Inscrição registrada!');
    e.target.reset();
  });
  $('contatoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: $('contatoNome').value.trim(), email: $('contatoEmail').value.trim().toLowerCase(),
      subject: $('contatoAssunto').value, message: $('contatoMensagem').value.trim()
    };
    const { error } = await supabase.from('contact_messages').insert(payload);
    if (error) { mostrarToast('Não foi possível enviar a mensagem.'); console.error(error); return; }
    e.target.reset(); mostrarToast('Mensagem enviada. Obrigado pelo contato!');
  });

  function renderTudo() { renderHero(); renderMelhores(); renderFeed(); renderCatalogo(); renderAnalises(); }

  async function iniciar() {
    if (!window.supabase || !window.RESPAWN_SUPABASE_URL || !window.RESPAWN_SUPABASE_KEY) {
      mostrarToast('Configuração do Supabase não encontrada.'); return;
    }
    renderTudo();
    const { data: { session } } = await supabase.auth.getSession();
    await carregarArtigosDoBanco();
    await atualizarEstadoAuth(session);
    renderTudo();
    supabase.auth.onAuthStateChange((_event, nextSession) => {
      queueMicrotask(() => atualizarEstadoAuth(nextSession));
    });
  }

  iniciar().catch((error) => {
    console.error('Falha ao iniciar Respawn:', error);
    mostrarToast('Erro ao conectar com o Supabase. Confira a configuração.');
  });
})();
