/* Atlas Orbital · conteúdo da aula
   Cada capítulo tem passos. Um passo diz o que a cena 3D mostra (view, sat, fase),
   qual laboratório abre (lab) e o texto do cartão. Dados conferidos nas fontes
   listadas em professor.html. */

window.SATS = {
  gedi: {
    nome: 'GEDI', tipo: 'lidar', cor: '#ff6a3d',
    alt: 420, inc: 51.6, raan: 20, fase0: 0.3,
    swath: 4.2, swathTxt: 'faixa de 8 trilhas ≈ 4,2 km', lab: 'lidar'
  },
  icesat2: {
    nome: 'ICESat-2', tipo: 'lidar', cor: '#5dff9a',
    alt: 496, inc: 92, raan: 140, fase0: 2.1,
    swath: 6.6, swathTxt: '3 pares de feixes ≈ 6,6 km', lab: 'fotons'
  },
  landsat9: {
    nome: 'Landsat 9', tipo: 'optico', cor: '#ffc94a',
    alt: 705, inc: 98.2, raan: 60, fase0: 4.0,
    swath: 185, swathTxt: 'faixa 185 km', lab: 'optico'
  },
  sentinel2: {
    nome: 'Sentinel-2', tipo: 'optico', cor: '#ffe08a',
    alt: 786, inc: 98.6, raan: 95, fase0: 1.2,
    swath: 290, swathTxt: 'faixa 290 km', lab: 'optico'
  },
  amazonia1: {
    nome: 'Amazonia-1', tipo: 'optico', cor: '#f2a93b',
    alt: 752, inc: 98.4, raan: 165, fase0: 5.2,
    swath: 850, swathTxt: 'faixa ≈ 850 km', lab: 'optico'
  },
  sentinel1: {
    nome: 'Sentinel-1', tipo: 'radar', cor: '#9fb4ff',
    alt: 693, inc: 98.2, raan: 115, fase0: 3.1,
    swath: 250, swathTxt: 'modo IW: faixa 250 km', lab: 'radar', banda: 'C'
  },
  nisar: {
    nome: 'NISAR', tipo: 'radar', cor: '#c49bff',
    alt: 747, inc: 98.4, raan: 35, fase0: 0.9,
    swath: 242, swathTxt: 'faixa ≈ 242 km (SweepSAR)', lab: 'radar', banda: 'L'
  },
  biomass: {
    nome: 'BIOMASS', tipo: 'radar', cor: '#ff8fd0',
    alt: 666, inc: 98, raan: 150, fase0: 2.7,
    swath: 50, swathTxt: 'faixa ≈ 50 km', lab: 'radar', banda: 'P'
  }
};

window.TIPOS = {
  lidar: { nome: 'Lidar · ativo', desc: 'dispara um laser e cronometra o eco' },
  optico: { nome: 'Óptico · passivo', desc: 'mede a luz do Sol refletida' },
  radar: { nome: 'Radar · ativo', desc: 'emite micro-ondas e mede o retorno' }
};

window.CAPS = [
  {
    id: 'abertura', titulo: 'Abertura', passos: [
      {
        view: 'capa', rotulo: 'Capa',
        h: 'Atlas Orbital',
        sub: 'Como os satélites enxergam a vegetação',
        p: 'Uma aula interativa de sensoriamento remoto. A Terra gira no centro; oito satélites reais estão em órbita. Cada um se abre para mostrar por dentro como mede a vegetação, do laser que cronometra a copa ao radar que atravessa as nuvens.',
        dica: 'Avance com → ou com o passador de slides. Arraste para girar a cena e use a roda do mouse para aproximar.'
      }
    ]
  },
  {
    id: 'terra', titulo: 'A Terra vista de cima', passos: [
      {
        view: 'frota', rotulo: 'A frota',
        h: 'Oito olhos em órbita',
        p: 'Cada anel é uma órbita, desenhada na escala real de altitude: a Estação Espacial voa a cerca de 420 km, e os satélites de imagem entre 660 e 790 km. Se a Terra fosse uma bola de futebol, eles passariam a menos de 1,5 cm da superfície.',
        dica: 'Clique em qualquer satélite para ir direto ao capítulo dele.',
        fatos: [['Raio da Terra', '6.371 km'], ['Volta completa', '≈ 90 a 100 min'], ['Voltas por dia', '≈ 14 a 16']]
      },
      {
        view: 'frota', destaque: 'tipos', rotulo: 'Passivos e ativos',
        h: 'Quem ilumina a cena?',
        p: 'Sensores <b>passivos</b> (ópticos) dependem da luz do Sol refletida: só funcionam de dia e não atravessam nuvens. Sensores <b>ativos</b> levam a própria fonte: o lidar dispara pulsos de laser e o radar emite micro-ondas. Eles medem o tempo e a intensidade do eco, e o radar funciona de noite e sob nuvens.',
        legenda: true
      },
      {
        view: 'frota', destaque: 'orbitas', rotulo: 'Órbitas',
        h: 'Duas famílias de órbita',
        p: 'Quase todos seguem órbitas <b>heliossíncronas</b> (inclinação de ~98°): passam sobre cada lugar sempre na mesma hora solar, o que mantém a iluminação comparável entre datas. O <b>GEDI</b> viaja preso à Estação Espacial, inclinada 51,6°. Por isso ele só mede entre as duas linhas tracejadas, de 51,6° S a 51,6° N, e não alcança as florestas boreais.',
        fatos: [['Heliossíncrona', '≈ 98°, passa ~10h ou ~18h'], ['ISS', '51,6°'], ['ICESat-2', '92°, chega a 88° de latitude']]
      },
      {
        view: 'frota', destaque: 'resolucoes', rotulo: 'Quatro resoluções',
        h: 'As quatro resoluções',
        p: 'Todo sensor é uma troca entre quatro resoluções. <b>Espacial</b>: o tamanho do pixel. <b>Espectral</b>: quantas faixas do espectro e quão estreitas. <b>Radiométrica</b>: quantos níveis de brilho (bits). <b>Temporal</b>: a cada quantos dias ele volta. Uma faixa larga aumenta a revisita, mas exige pixels maiores ou muito mais dados.',
        fatos: [['Espacial', '1 m a 1 km'], ['Espectral', '4 a 13 bandas aqui'], ['Radiométrica', '10 a 14 bits'], ['Temporal', '5 a 91 dias']]
      }
    ]
  },

  /* ---------------- GEDI ---------------- */
  {
    id: 'gedi', sat: 'gedi', titulo: 'GEDI', kicker: 'Lidar de forma de onda', passos: [
      {
        fase: 'encontro', rotulo: 'Encontro',
        h: 'GEDI, o laser da Estação Espacial',
        p: 'O GEDI (<i>Global Ecosystem Dynamics Investigation</i>) é um lidar preso do lado de fora da Estação Espacial Internacional. Ele não espera a luz do Sol: dispara o próprio laser e cronometra o eco. Foi o primeiro lidar espacial feito para medir a estrutura vertical das florestas.',
        fatos: [['Agência', 'NASA · Universidade de Maryland'], ['Plataforma', 'ISS, módulo japonês Kibo (JEM-EF)'], ['Lançamento', '5 dez 2018, SpaceX CRS-16'], ['Órbita', '≈ 420 km · inclinação 51,6°'], ['Sensor', 'Lidar de forma de onda, 1064 nm'], ['Situação', 'Em operação. Hibernou de mar/2023 a abr/2024']]
      },
      {
        fase: 'abrir', rotulo: 'Abrir',
        h: 'Abrindo o GEDI',
        p: 'O instrumento sai do encaixe da Estação e se abre. Sob a manta térmica dourada ficam três lasers, um telescópio e a eletrônica que grava cada eco como uma curva.',
        partes: true
      },
      {
        fase: 'lab', rotulo: 'Como funciona',
        h: 'Cronometrando a floresta',
        p: 'Cada pulso dura cerca de 15 nanossegundos e ilumina um círculo de ~25 m. A luz bate primeiro no topo da copa, depois nos galhos e por último no chão. Como o tempo de volta é <b>t = 2h / c</b>, cada metro de altura vale ~6,7 ns. O gráfico à direita é a <b>forma de onda</b>: quanta energia voltou de cada altura. Da energia acumulada saem as alturas relativas RH25, RH50 e RH98.',
        dica: 'Troque a vegetação no laboratório e compare as curvas.'
      },
      {
        fase: 'dado', rotulo: 'O dado',
        h: 'Amostras, não imagens',
        p: 'O GEDI não faz imagem: ele colhe amostras em trilhas. Entre elas fica um vazio que outros satélites ajudam a preencher (capítulo Modelos de dossel). No Cerrado ralo, os ecos da copa e do chão se sobrepõem, e alturas abaixo de ~3 m ficam incertas.',
        fatos: [['Pegada', '≈ 25 m de diâmetro'], ['Ao longo da trilha', 'uma pegada a cada 60 m'], ['Trilhas', '8, a 600 m uma da outra'], ['Feixes', '4: 1 laser dividido em 2 + 2 lasers de potência total; a deflexão alternada gera 8 trilhas'], ['Cobertura', 'de 51,6° S a 51,6° N'], ['Produtos', 'L1B forma de onda · L2A alturas RH · L2B cobertura e PAI · L4A biomassa por pegada · L4B biomassa em grade de 1 km']],
        pergunta: 'Por que se usa RH98 como altura do dossel, e não RH100?'
      }
    ]
  },

  /* ---------------- ICESat-2 ---------------- */
  {
    id: 'icesat2', sat: 'icesat2', titulo: 'ICESat-2', kicker: 'Lidar de contagem de fótons', passos: [
      {
        fase: 'encontro', rotulo: 'Encontro',
        h: 'ICESat-2, o contador de fótons',
        p: 'Também é um lidar, com outra lógica: em vez de gravar a curva inteira do eco, ele registra fótons um a um. Foi feito para medir gelo, mas a mesma técnica mede o chão e o topo das árvores, inclusive acima de 52° de latitude, onde o GEDI não chega.',
        fatos: [['Agência', 'NASA'], ['Lançamento', '15 set 2018, último voo do Delta II'], ['Órbita', '≈ 496 km · inclinação 92°'], ['Sensor', 'ATLAS: lidar de contagem de fótons, 532 nm (verde)'], ['Repetição', '91 dias']]
      },
      {
        fase: 'abrir', rotulo: 'Abrir',
        h: 'Abrindo o ICESat-2',
        p: 'Dobrado para caber no foguete, ele abre o painel solar em órbita. O instrumento ATLAS ocupa a face voltada para a Terra: um laser verde, um elemento óptico que divide o feixe em seis, e detectores sensíveis a um único fóton.',
        partes: true
      },
      {
        fase: 'lab', rotulo: 'Como funciona',
        h: 'Uma dúzia de fótons por pulso',
        p: 'A cada pulso saem trilhões de fótons verdes. Voltam ao telescópio poucos, cerca de uma dúzia no feixe forte. O detector anota o horário de cada um. Com 10 mil pulsos por segundo, um a cada 0,7 m no chão, os fótons desenham uma <b>nuvem</b>: topo da copa, interior e chão. De dia a luz do Sol soma fótons verdes falsos, que são ruído.',
        dica: 'Alterne dia e noite, feixe forte e fraco, e depois classifique os fótons.'
      },
      {
        fase: 'dado', rotulo: 'O dado',
        h: 'Do fóton à altura do dossel',
        p: 'O produto ATL03 traz cada fóton com posição e altitude. O ATL08 separa os fótons de solo e de vegetação e calcula o terreno e a altura do dossel em segmentos de 100 m (e de 20 m nas versões recentes). Em floresta densa e de dia, poucos fótons chegam ao chão.',
        fatos: [['Feixes', '6, em 3 pares: forte e fraco (≈ 4:1)'], ['Pegada', '≈ 11 m'], ['Espaçamento', 'um pulso a cada 0,7 m'], ['Entre pares', '≈ 3,3 km'], ['Produtos', 'ATL03 fótons · ATL08 terreno e dossel']],
        pergunta: 'O Sol emite mais luz perto de 500 nm. Por que isso pesa mais para o ICESat-2 (532 nm) do que para o GEDI (1064 nm)?'
      }
    ]
  },

  /* ---------------- Landsat 9 ---------------- */
  {
    id: 'landsat9', sat: 'landsat9', titulo: 'Landsat 9', kicker: 'Óptico multiespectral', passos: [
      {
        fase: 'encontro', rotulo: 'Encontro',
        h: 'Landsat 9, meio século de imagens',
        p: 'É o nono da série que fotografa a Terra desde 1972, o arquivo contínuo mais longo de imagens da superfície. É passivo: mede a luz do Sol refletida e o calor que a superfície emite.',
        fatos: [['Agências', 'NASA · USGS'], ['Lançamento', '27 set 2021, Atlas V'], ['Órbita', '705 km · heliossíncrona, ~10h'], ['Sensores', 'OLI-2 (óptico) e TIRS-2 (termal)'], ['Revisita', '16 dias; 8 dias junto com o Landsat 8']]
      },
      {
        fase: 'abrir', rotulo: 'Abrir',
        h: 'Abrindo o Landsat 9',
        p: 'O painel solar sai do lado do corpo e se estende. Na face voltada para a Terra ficam os dois instrumentos: o OLI-2, que mede do azul ao infravermelho de ondas curtas, e o TIRS-2, que mede o calor.',
        partes: true
      },
      {
        fase: 'lab', rotulo: 'Como funciona',
        h: 'Uma linha de detectores',
        p: 'O OLI-2 é um sensor de <b>varredura empurrada</b> (pushbroom): uma linha de milhares de detectores atravessa a faixa, e o próprio avanço do satélite forma a imagem, linha a linha. Cada <b>banda</b> é um filtro que mede uma faixa do espectro. A vegetação absorve o vermelho (clorofila) e reflete muito o infravermelho próximo; o NDVI vem desse contraste.',
        dica: 'Passe o mouse sobre a imagem para ler as bandas de cada pixel. Troque a estação e a composição.'
      },
      {
        fase: 'dado', rotulo: 'O dado',
        h: 'O padrão das séries históricas',
        p: 'Com 30 m de pixel e meio século de arquivo, o Landsat sustenta séries como o MapBiomas (desde 1985) e o PRODES Cerrado. A Coleção 2, Nível 2, entrega reflectância e temperatura de superfície já corrigidas.',
        fatos: [['Faixa', '185 km'], ['Resolução', '30 m · pancromática 15 m · termal 100 m'], ['Bandas', '9 no OLI-2 + 2 no TIRS-2'], ['Radiometria', '14 bits'], ['Produto', 'Coleção 2, Nível 2: reflectância e temperatura de superfície']],
        pergunta: 'Mesmo com Landsat 8 e 9 juntos (8 dias), por que ainda é difícil acompanhar as queimadas no Cerrado?'
      }
    ]
  },

  /* ---------------- Sentinel-2 ---------------- */
  {
    id: 'sentinel2', sat: 'sentinel2', titulo: 'Sentinel-2', kicker: 'Óptico com borda do vermelho', passos: [
      {
        fase: 'encontro', rotulo: 'Encontro',
        h: 'Sentinel-2, a cada cinco dias',
        p: 'Dois satélites gêmeos em lados opostos da mesma órbita fotografam cada lugar a cada 5 dias, com até 10 m de resolução. Os dados são abertos, pelo programa europeu Copernicus.',
        fatos: [['Agência', 'ESA · Comissão Europeia (Copernicus)'], ['Lançamentos', '2A jun 2015 · 2B mar 2017 · 2C set 2024'], ['Órbita', '786 km · heliossíncrona, ~10h30'], ['Sensor', 'MSI, 13 bandas'], ['Revisita', '5 dias no Equador, com dois satélites']]
      },
      {
        fase: 'abrir', rotulo: 'Abrir',
        h: 'Abrindo o Sentinel-2',
        p: 'O painel solar abre de um lado só. O instrumento MSI usa um telescópio de três espelhos e um divisor que manda a luz para dois planos focais: um para o visível e o infravermelho próximo, outro para o infravermelho de ondas curtas.',
        partes: true
      },
      {
        fase: 'lab', rotulo: 'Como funciona',
        h: 'Três bandas na borda do vermelho',
        p: 'O MSI também é pushbroom, mas tem algo que o Landsat não tem: as bandas B5, B6 e B7 na <b>borda do vermelho</b> (705 a 783 nm), o trecho onde a reflectância da folha sobe de repente. A posição dessa subida muda com a clorofila e o estresse hídrico, antes de o verde sumir.',
        dica: 'Veja as bandas B5 a B7 na encosta da curva da vegetação.'
      },
      {
        fase: 'dado', rotulo: 'O dado',
        h: 'Resolução mista',
        p: 'As bandas têm 10, 20 ou 60 m, conforme o uso. No Cerrado, a borda do vermelho e o infravermelho de ondas curtas ajudam a separar formações savânicas e campestres e a acompanhar a fenologia da seca.',
        fatos: [['Faixa', '290 km'], ['10 m', 'B2, B3, B4, B8'], ['20 m', 'B5, B6, B7, B8A, B11, B12'], ['60 m', 'B1, B9, B10'], ['Radiometria', '12 bits'], ['Produtos', 'L1C topo da atmosfera · L2A reflectância de superfície']],
        pergunta: 'Que par de bandas você usaria para destacar cicatrizes de fogo? (Dica: o índice NBR.)'
      }
    ]
  },

  /* ---------------- Amazonia-1 ---------------- */
  {
    id: 'amazonia1', sat: 'amazonia1', titulo: 'Amazonia-1', kicker: 'Óptico de faixa larga', passos: [
      {
        fase: 'encontro', rotulo: 'Encontro',
        h: 'Amazonia-1, o satélite brasileiro',
        p: 'Primeiro satélite de observação da Terra totalmente projetado, integrado, testado e operado pelo Brasil. Sua câmera tem faixa larga para ver o país inteiro com frequência.',
        fatos: [['Agências', 'INPE · AEB'], ['Lançamento', '28 fev 2021, PSLV-C51 (Índia)'], ['Órbita', '≈ 752 km · heliossíncrona, ~10h30'], ['Sensor', 'Câmera WFI, 4 bandas'], ['Revisita', '5 dias']]
      },
      {
        fase: 'abrir', rotulo: 'Abrir',
        h: 'Abrindo o Amazonia-1',
        p: 'Ele é construído sobre a Plataforma Multimissão (PMM), desenvolvida no Brasil para servir a vários satélites. Sobre ela vai o módulo de carga útil, com a câmera WFI.',
        partes: true
      },
      {
        fase: 'lab', rotulo: 'Como funciona',
        h: 'Faixa larga, pixel grande',
        p: 'A WFI mede quatro bandas: azul, verde, vermelho e infravermelho próximo. Com elas já se calcula o NDVI. Para cobrir ~850 km de faixa, o pixel fica em ~60 m: compare no laboratório como o mesmo terreno aparece mais grosseiro do que no Sentinel-2.',
        dica: 'Note que o Amazonia-1 não tem bandas no infravermelho de ondas curtas.'
      },
      {
        fase: 'dado', rotulo: 'O dado',
        h: 'Monitoramento frequente',
        p: 'A revisita de 5 dias com faixa larga apoia sistemas de alerta de desmatamento, como o DETER, na Amazônia e no Cerrado. As imagens são distribuídas gratuitamente pelo catálogo do INPE.',
        fatos: [['Faixa', '≈ 850 km'], ['Resolução', '≈ 60 m'], ['Bandas', 'azul, verde, vermelho, infravermelho próximo'], ['Vida útil projetada', '4 anos'], ['Dados', 'Catálogo de imagens do INPE, gratuito']],
        pergunta: 'Por que um mesmo sensor não costuma ter 850 km de faixa e 10 m de pixel ao mesmo tempo?'
      }
    ]
  },

  /* ---------------- Sentinel-1 ---------------- */
  {
    id: 'sentinel1', sat: 'sentinel1', titulo: 'Sentinel-1', kicker: 'Radar banda C', passos: [
      {
        fase: 'encontro', rotulo: 'Encontro',
        h: 'Sentinel-1, o radar que não perde a chuva',
        p: 'Um radar de abertura sintética (SAR) em banda C. Ele mesmo emite micro-ondas e mede o eco, de lado: funciona de dia, de noite e através das nuvens, o que é essencial na estação chuvosa.',
        fatos: [['Agência', 'ESA · Copernicus'], ['Lançamentos', '1A abr 2014 · 1C dez 2024 · 1D nov 2025 (o 1B parou em dez 2021)'], ['Órbita', '693 km · heliossíncrona, ~6h e ~18h'], ['Sensor', 'SAR banda C, 5,405 GHz (λ ≈ 5,5 cm)'], ['Repetição', '12 dias por satélite']]
      },
      {
        fase: 'abrir', rotulo: 'Abrir',
        h: 'Abrindo o Sentinel-1',
        p: 'A antena do radar tem 12,3 m de comprimento e viaja dobrada em painéis. Em órbita ela se estende ao longo da direção de voo, ao lado das duas asas de painéis solares.',
        partes: true
      },
      {
        fase: 'lab', rotulo: 'Como funciona',
        h: 'Olhar de lado, medir o eco',
        p: 'O radar olha de lado (visada oblíqua) e mede quanto da energia volta: o <b>retroespalhamento</b>. Em banda C, a onda de ~5,5 cm interage sobretudo com folhas e galhos finos do topo da copa. As nuvens são transparentes para ela, porque as gotas são muito menores que o comprimento de onda.',
        dica: 'Troque a banda no laboratório e veja até onde a onda penetra.'
      },
      {
        fase: 'dado', rotulo: 'O dado',
        h: 'Alertas sob nuvens',
        p: 'Comparar passagens a cada 12 dias revela onde a floresta foi derrubada, mesmo com nuvem. A banda C satura em biomassa alta: diferencia floresta de pasto, mas não distingue bem uma floresta média de uma muito densa.',
        fatos: [['Modo IW', 'faixa 250 km · 5 × 20 m'], ['Polarizações', 'VV + VH'], ['Produtos', 'GRD (intensidade) · SLC (fase, para interferometria)'], ['Antena', '12,3 m × 0,8 m']],
        pergunta: 'Por que o radar "vê" através da nuvem e o Sentinel-2 não?'
      }
    ]
  },

  /* ---------------- NISAR ---------------- */
  {
    id: 'nisar', sat: 'nisar', titulo: 'NISAR', kicker: 'Radar bandas L e S', passos: [
      {
        fase: 'encontro', rotulo: 'Encontro',
        h: 'NISAR, dois radares e uma antena',
        p: 'Parceria entre NASA e ISRO, é o primeiro satélite com dois radares: banda L (24 cm, da NASA) e banda S (~10 cm, da ISRO). Os dois dividem uma antena refletora de 12 m.',
        fatos: [['Agências', 'NASA · ISRO'], ['Lançamento', '30 jul 2025, GSLV-F16 (Sriharikota)'], ['Órbita', '747 km · heliossíncrona, 98,4°'], ['Sensores', 'SAR banda L e banda S, técnica SweepSAR'], ['Repetição', '12 dias'], ['Situação', 'Fase científica desde nov/2025']]
      },
      {
        fase: 'abrir', rotulo: 'Abrir',
        h: 'Abrindo o NISAR',
        p: 'O refletor viaja fechado como um guarda-chuva. Em órbita, um braço de 9 m se desdobra e a malha dourada de 12 m se abre. Os alimentadores das bandas L e S ficam na estrutura do radar, apontados para o refletor.',
        partes: true
      },
      {
        fase: 'lab', rotulo: 'Como funciona',
        h: 'Banda L: dos galhos ao tronco',
        p: 'Com 24 cm, a onda da banda L passa pelas folhas e volta dos galhos grossos e troncos. Parte dela bate no tronco, desce, reflete no chão e volta: o <b>duplo salto</b>. Por isso o sinal acompanha a biomassa até valores maiores que a banda C.',
        dica: 'Compare L com S e com C no laboratório.'
      },
      {
        fase: 'dado', rotulo: 'O dado',
        h: 'Biomassa das savanas',
        p: 'A missão mira biomassa de até ~100 Mg/ha, faixa em que estão savanas e florestas em regeneração, ou seja, boa parte do Cerrado. Por interferometria, mede também deformações do terreno de centímetros.',
        fatos: [['Faixa', '≈ 242 km (SweepSAR)'], ['Antena', 'refletor de 12 m em braço de 9 m'], ['Missão mínima', '3 anos (L) · 5 anos (S)'], ['Usos', 'biomassa, desmatamento, culturas, gelo, deformação']],
        pergunta: 'Por que duas passagens com 12 dias de diferença revelam o desmatamento mesmo sob nuvens?'
      }
    ]
  },

  /* ---------------- BIOMASS ---------------- */
  {
    id: 'biomass', sat: 'biomass', titulo: 'BIOMASS', kicker: 'Radar banda P', passos: [
      {
        fase: 'encontro', rotulo: 'Encontro',
        h: 'BIOMASS, a balança da floresta',
        p: 'Missão Earth Explorer da ESA e primeiro radar em banda P no espaço. Com onda de ~69 cm, ela atravessa a copa inteira para estimar quanto a floresta pesa.',
        fatos: [['Agência', 'ESA'], ['Lançamento', '29 abr 2025, Vega-C (Kourou)'], ['Órbita', '≈ 666 km · heliossíncrona, ~6h'], ['Sensor', 'SAR banda P, 435 MHz (λ ≈ 69 cm)'], ['Antena', 'refletor de 12 m'], ['Duração prevista', '5 anos']]
      },
      {
        fase: 'abrir', rotulo: 'Abrir',
        h: 'Abrindo o BIOMASS',
        p: 'Como o NISAR, ele abre em órbita um refletor de 12 m na ponta de um braço. O alimentador em banda P ilumina o refletor, que concentra o feixe sobre a floresta.',
        partes: true
      },
      {
        fase: 'lab', rotulo: 'Como funciona',
        h: 'Tomografia da floresta',
        p: 'A banda P chega ao chão e volta dos troncos, onde está a maior parte da biomassa. Na fase <b>tomográfica</b>, várias passagens com ângulos ligeiramente diferentes reconstroem a floresta em fatias verticais, como uma tomografia médica.',
        dica: 'Selecione a banda P e compare o duplo salto com a banda C.'
      },
      {
        fase: 'dado', rotulo: 'O dado',
        h: 'Biomassa, altura e perturbação',
        p: 'Os produtos previstos são mapas de biomassa acima do solo e de altura da floresta (~200 m) e de perturbação (~50 m), com foco nas florestas tropicais. Por regra de uso de frequências, ele não opera sobre a América do Norte e a Europa.',
        fatos: [['Medidas', 'biomassa acima do solo · altura · perturbação'], ['Pixel dos produtos', '≈ 200 m (biomassa, altura) · ≈ 50 m (perturbação)'], ['Restrição', 'sem medições sobre América do Norte e Europa']],
        pergunta: 'Se a banda P atravessa tão bem a floresta, por que não usá-la em todos os radares?'
      }
    ]
  },

  /* ---------------- Modelos de dossel ---------------- */
  {
    id: 'dossel', titulo: 'Modelos de dossel', kicker: 'Fusão de dados e IA', passos: [
      {
        view: 'fusao', estagio: 0, rotulo: 'O problema',
        h: 'Pontos de um lado, imagens do outro',
        p: 'O GEDI e o ICESat-2 medem a altura da vegetação, mas só em amostras ao longo de trilhas. O Sentinel-2 e o Landsat cobrem tudo, mas não medem altura diretamente. Um modelo de dossel junta os dois.',
        dica: 'À esquerda, a imagem com as pegadas do GEDI coloridas pela altura medida.'
      },
      {
        view: 'fusao', estagio: 1, rotulo: 'A fusão',
        h: 'A rede aprende com as pegadas',
        p: 'Uma rede neural recebe os pixels da imagem e aprende a prever a altura usando as pegadas do GEDI como resposta certa. Depois, aplica o que aprendeu em todos os pixels, inclusive onde não há pegada.',
        dica: 'Observe o mapa de altura sendo preenchido linha a linha.'
      },
      {
        view: 'fusao', estagio: 2, rotulo: 'Mapas que existem',
        h: 'Mapas de altura do dossel',
        p: 'Três mapas globais seguem essa receita, com resolução cada vez mais fina. Todos usam o GEDI como referência de altura.',
        fatos: [['Potapov et al. 2021', '30 m · Landsat + GEDI · ano 2019'], ['Lang et al. 2023', '10 m · Sentinel-2 + GEDI · ano 2020, com incerteza por pixel'], ['Tolan et al. 2024', '≈ 1 m · imagens Maxar + rede DINOv2 + GEDI (Meta e WRI)'], ['GEDI L4B', 'biomassa em grade de 1 km'], ['A seguir', 'NISAR e BIOMASS, por radar']]
      },
      {
        view: 'fusao', estagio: 3, rotulo: 'Cuidado ao usar',
        h: 'Onde o modelo erra',
        p: 'O mapa de erro mostra a diferença entre a altura prevista e a real. Os modelos tendem a <b>subestimar árvores altas</b> (o sinal óptico satura) e a errar mais em vegetação baixa e aberta, como o cerrado típico e o campo, onde o próprio GEDI é menos preciso. Antes de usar, confira a data de referência e valide com lidar aéreo ou parcelas de campo.',
        pergunta: 'Num estudo de carbono no Cerrado, que dado de campo você coletaria para validar um desses mapas?'
      }
    ]
  },

  /* ---------------- Desafio ---------------- */
  {
    id: 'desafio', titulo: 'Desafio', passos: [
      {
        view: 'quiz', rotulo: 'Escolha o sensor',
        h: 'Qual satélite você usaria?',
        p: 'Para cada situação, escolha o sensor mais adequado. A explicação aparece depois da escolha.'
      }
    ]
  }
];

/* Partes de cada satélite: nome curto + função. A ordem é a numeração nas etiquetas 3D. */
window.PARTES = {
  gedi: [
    ['Manta térmica', 'Isolamento multicamadas que protege o instrumento do calor e do frio extremos.'],
    ['Três lasers Nd:YAG', 'Disparam 242 pulsos por segundo em 1064 nm. Um deles é dividido em dois feixes.'],
    ['Unidades de deflexão', 'Desviam pulsos alternados para o lado: 4 feixes viram 8 trilhas no chão.'],
    ['Telescópio de 0,8 m', 'Espelho de berílio que coleta a luz que volta da Terra.'],
    ['Detectores e digitalizador', 'Convertem o eco em uma curva de energia por tempo: a forma de onda.'],
    ['Rastreadores estelares', 'Fotografam estrelas para saber a orientação exata de cada disparo.'],
    ['Interface com a ISS', 'Encaixe que prende o GEDI ao módulo Kibo e recebe energia e dados.']
  ],
  icesat2: [
    ['Plataforma', 'Corpo do satélite: energia, controle de atitude e comunicação.'],
    ['Lasers (2)', 'Um ativo e um reserva: 10 mil pulsos verdes por segundo, em 532 nm.'],
    ['Elemento óptico difrativo', 'Divide o feixe em 6: três pares de feixe forte e fraco.'],
    ['Telescópio de 0,8 m', 'Coleta os poucos fótons que voltam de cada pulso.'],
    ['Detectores de fóton único', 'Fotomultiplicadoras que anotam o horário de chegada de cada fóton.'],
    ['Rastreadores estelares', 'Medem a orientação para localizar cada pulso no chão.'],
    ['Painel solar', 'Viaja dobrado e se abre em órbita.']
  ],
  landsat9: [
    ['Plataforma', 'Corpo do satélite: energia, computador de bordo e controle.'],
    ['OLI-2', 'Telescópio de 4 espelhos e 14 módulos de detectores em linha: 9 bandas.'],
    ['TIRS-2', 'Duas bandas termais (~11 e ~12 µm), com detectores resfriados a cerca de −230 °C.'],
    ['Painel solar', 'Sai do lado do corpo e se estende em órbita.'],
    ['Antena de banda X', 'Envia as imagens para as estações em terra.'],
    ['Rastreadores estelares', 'Garantem o apontamento para localizar cada pixel.']
  ],
  sentinel2: [
    ['Plataforma', 'Corpo do satélite: energia, controle e memória de bordo.'],
    ['Telescópio de três espelhos', 'Forma a imagem de uma faixa de 290 km.'],
    ['Divisor dicroico', 'Separa a luz visível e infravermelha próxima da de ondas curtas.'],
    ['Plano focal VNIR', '10 bandas do visível ao infravermelho próximo, incluindo a borda do vermelho.'],
    ['Plano focal SWIR', '3 bandas de ondas curtas (B10, B11, B12), com detectores resfriados.'],
    ['Difusor de calibração', 'Placa que reflete o Sol para calibrar os detectores em voo.'],
    ['Painel solar', 'Uma única asa, que se abre em órbita.']
  ],
  amazonia1: [
    ['Plataforma Multimissão (PMM)', 'Módulo de serviço brasileiro: energia, controle e comunicação.'],
    ['Módulo de carga útil', 'Abriga a câmera e os gravadores de dados.'],
    ['Câmera WFI', 'Imageador de visada larga: 4 bandas, faixa de ~850 km.'],
    ['Painel solar', 'Asa que se abre após a separação do foguete.'],
    ['Transmissores de dados', 'Enviam as imagens para as estações do INPE.']
  ],
  sentinel1: [
    ['Plataforma', 'Corpo do satélite: energia, controle e memória.'],
    ['Antena SAR de 12,3 m', 'Emite e recebe os pulsos de micro-ondas. Viaja dobrada em painéis.'],
    ['Painéis solares', 'Duas asas que alimentam o radar, que consome muita energia.'],
    ['Terminal laser', 'Envia dados por laser a satélites retransmissores.'],
    ['Antena de banda X', 'Envia os dados direto às estações em terra.']
  ],
  nisar: [
    ['Plataforma I-3K', 'Corpo do satélite, fornecido pela ISRO.'],
    ['Estrutura do radar', 'Abriga a eletrônica das bandas L e S.'],
    ['Alimentador banda L', 'Conjunto de antenas da NASA/JPL que ilumina o refletor.'],
    ['Alimentador banda S', 'Conjunto de antenas da ISRO.'],
    ['Braço de 9 m', 'Desdobra-se em órbita e afasta o refletor do corpo.'],
    ['Refletor de malha de 12 m', 'Abre como guarda-chuva e concentra os sinais de ida e volta.'],
    ['Painéis solares', 'Duas asas que alimentam os dois radares.']
  ],
  biomass: [
    ['Plataforma', 'Corpo do satélite: energia, controle e comunicação.'],
    ['Alimentador banda P', 'Antena que ilumina o refletor em 435 MHz.'],
    ['Braço', 'Desdobra-se em órbita e posiciona o refletor.'],
    ['Refletor de 12 m', 'Malha que se abre em órbita e forma o feixe do radar.'],
    ['Painéis solares', 'Abrem após a separação do foguete.']
  ]
};

window.QUIZ = [
  {
    q: 'Detectar uma queimada recente no Cerrado, com pixel de 10 m e revisita de poucos dias.',
    op: [['sentinel2', 'Sentinel-2'], ['gedi', 'GEDI'], ['biomass', 'BIOMASS']],
    certa: 'sentinel2',
    exp: 'O Sentinel-2 revisita a cada 5 dias com 10 a 20 m, e as bandas de infravermelho próximo e de ondas curtas (NBR) destacam a cicatriz. O GEDI só amostra trilhas; o BIOMASS tem pixel de ~200 m.'
  },
  {
    q: 'Medir o perfil vertical de uma floresta, do topo da copa ao chão, em pontos amostrais.',
    op: [['landsat9', 'Landsat 9'], ['gedi', 'GEDI'], ['sentinel1', 'Sentinel-1']],
    certa: 'gedi',
    exp: 'O lidar de forma de onda registra a energia que volta de cada altura. Daí saem RH98, cobertura e o perfil de área de planta.'
  },
  {
    q: 'Mapear derrubadas em plena estação chuvosa, com o céu coberto há semanas.',
    op: [['amazonia1', 'Amazonia-1'], ['sentinel1', 'Sentinel-1'], ['landsat9', 'Landsat 9']],
    certa: 'sentinel1',
    exp: 'O radar leva a própria fonte e as micro-ondas atravessam nuvens. Os ópticos dependem de céu limpo.'
  },
  {
    q: 'Montar uma série de uso da terra de 1985 até hoje.',
    op: [['sentinel2', 'Sentinel-2'], ['nisar', 'NISAR'], ['landsat9', 'Série Landsat']],
    certa: 'landsat9',
    exp: 'Só a série Landsat tem arquivo contínuo desde a década de 1970 com 30 m. O Sentinel-2 começa em 2015 e o NISAR em 2025.'
  },
  {
    q: 'Medir a altura de uma floresta boreal a 60° N.',
    op: [['gedi', 'GEDI'], ['icesat2', 'ICESat-2'], ['amazonia1', 'Amazonia-1']],
    certa: 'icesat2',
    exp: 'O GEDI está preso à órbita da ISS e só mede até 51,6°. O ICESat-2, com 92° de inclinação, chega a 88°.'
  },
  {
    q: 'Estimar a biomassa de uma floresta tropical densa, onde a banda C já saturou.',
    op: [['biomass', 'BIOMASS'], ['sentinel1', 'Sentinel-1'], ['sentinel2', 'Sentinel-2']],
    certa: 'biomass',
    exp: 'A banda P (~69 cm) penetra até os troncos e o chão, e o sinal continua sensível em biomassas altas.'
  }
];
