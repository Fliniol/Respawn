const ARTIGOS = [
  {
    id: "a1",
    titulo: "Estúdio independente cearense anuncia RPG tático ambientado no sertão",
    excerpt: "Produção nacional mistura mecânicas de turnos com narrativa histórica sobre a seca de 1877.",
    conteudo: [
      "Desenvolvido em Fortaleza por uma equipe de 14 pessoas, 'Sol de Ferro' aposta em combates táticos em grade inspirados nos clássicos do gênero, mas com identidade visual e trilha sonora baseadas na cultura nordestina.",
      "O jogador lidera uma caravana em busca de água e abrigo, precisando gerenciar suprimentos, moral do grupo e alianças políticas entre vilarejos isolados.",
      "Uma demonstração gratuita estará disponível para PC durante a próxima feira brasileira de jogos independentes."
    ],
    categoria: "noticia",
    tempo: "há 2h",
    curtidas: 0,
    imagem: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    destaque: true,
    autor: "Marina Alcântara"
  },
  {
    id: "a2",
    titulo: "Guia completo: todos os finais secretos do último capítulo",
    excerpt: "Mapeamos as seis rotas alternativas e o que cada escolha desbloqueia no New Game+.",
    conteudo: [
      "Para liberar o sexto final verdadeiro, não basta derrotar o chefe final: você precisa concluir as três missões secundárias do Observatório antes do eclipse lunar.",
      "Confira no nosso roteiro a ordem exata dos diálogos que mantêm a lealdade da capitã intacta até o ato final."
    ],
    categoria: "guia",
    tempo: "há 5h",
    curtidas: 0,
    imagem: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    autor: "Lucas Ferreira"
  },
  {
    id: "a3",
    titulo: "Data de lançamento confirmada para outubro, com edição física limitada",
    excerpt: "Pré-venda abre na próxima semana com artbook impresso e trilha sonora em vinil.",
    conteudo: [
      "A publicadora confirmou que o lançamento mundial ocorre em 18 de outubro para PC, PlayStation 5 e Xbox Series X|S.",
      "A edição de colecionador terá tiragem numerada e incluirá código para a primeira expansão de história."
    ],
    categoria: "lancamento",
    tempo: "há 6h",
    curtidas: 0,
    imagem: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=900&q=80",
    autor: "Redação Respawn"
  },
  {
    id: "a4",
    titulo: "Patch corrige bug que travava conquistas em 15% das partidas",
    excerpt: "Desenvolvedora confirma que save games afetados poderão ser recuperados automaticamente.",
    conteudo: [
      "A atualização 1.04 já está disponível para download e verifica o progresso acumulado assim que o jogador carrega seu arquivo salvo.",
      "Além das conquistas, o patch melhora a estabilidade de quadros em áreas com muita névoa volumétrica."
    ],
    categoria: "noticia",
    tempo: "há 8h",
    curtidas: 0,
    imagem: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=900&q=80",
    autor: "Redação Respawn"
  },
  {
    id: "a5",
    titulo: "Como montar a build mais eficiente para o modo pesadelo",
    excerpt: "Testamos 12 combinações de habilidades e equipamentos — essas quatro dominaram o endgame.",
    conteudo: [
      "No modo pesadelo, priorizar regeneração de energia e esquiva perfeita supera qualquer investimento bruto em armadura pesada.",
      "Combine o amuleto de cristal com a lâmina leve para aplicar sangramento contínuo nos chefes."
    ],
    categoria: "guia",
    tempo: "há 11h",
    curtidas: 0,
    imagem: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80",
    autor: "Lucas Ferreira"
  },
  {
    id: "a6",
    titulo: "Expansão gratuita chega em dezembro com novo bioma jogável",
    excerpt: "Conteúdo inclui três chefes inéditos, novas armas e sistema de clima dinâmico.",
    conteudo: [
      "Ambientada nas ruínas submersas do norte, a expansão adiciona cerca de 8 horas inéditas de campanha sem custo adicional para quem possui o jogo base."
    ],
    categoria: "lancamento",
    tempo: "há 14h",
    curtidas: 0,
    imagem: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
    autor: "Marina Alcântara"
  }
];

const CATALOGO_JOGOS = [
  {
    id: "j1",
    titulo: "Crônicas de Aurora",
    genero: "RPG de Ação",
    plataformas: ["PC", "PS5", "Switch"],
    nota: 9.2,
    capa: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    descricao: "Mundo aberto interconectado com escolhas morais permanentes e trilha orquestrada."
  },
  {
    id: "j2",
    titulo: "Ferrovia Zero",
    genero: "Estratégia & Gestão",
    plataformas: ["PC", "Xbox"],
    nota: 8.4,
    capa: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=600&q=80",
    descricao: "Construa linhas logísticas em regiões congeladas administrando recursos escassos."
  },
  {
    id: "j3",
    titulo: "Oficina 9",
    genero: "Simulação & Crafting",
    plataformas: ["PC"],
    nota: 8.9,
    capa: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    descricao: "Automação industrial profunda com suporte nativo a modificações da comunidade."
  },
  {
    id: "j4",
    titulo: "Marés de Cassandra",
    genero: "Aventura Narrativa",
    plataformas: ["PS5"],
    nota: 6.8,
    capa: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    descricao: "Direção de arte cinematográfica em uma investigação marítima cheia de mistérios."
  }
];

const ANALISES = [
  { titulo: "Crônicas de Aurora", plataforma: "PC · PS5 · Switch", nota: 9.2, veredito: "Narrativa densa carrega um combate ainda meio travado." },
  { titulo: "Ferrovia Zero", plataforma: "PC · Xbox", nota: 8.4, veredito: "Gestão viciante, mas a curva de dificuldade é irregular." },
  { titulo: "Marés de Cassandra", plataforma: "PS5", nota: 6.8, veredito: "Visual impecável não segura uma campanha rasa." },
  { titulo: "Oficina 9", plataforma: "PC", nota: 8.9, veredito: "O melhor jogo de crafting do ano, sem exagero." }
];

const COMENTARIOS_INICIAIS = {
  a1: [
    {
      id: "c1",
      autor: "Renan Castelo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      texto: "Sensacional ver um estúdio de Fortaleza trazendo nossa história para um RPG tático!",
      data: "há 1h"
    }
  ],
  a6: [
    {
      id: "c2",
      autor: "Ellen Venancio",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      texto: "Expansão gratuita desse tamanho hoje em dia é raridade. Já quero testar os chefes novos.",
      data: "há 4h"
    }
  ]
};