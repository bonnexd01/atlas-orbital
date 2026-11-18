# Atlas Orbital

Aula interativa de sensoriamento remoto da vegetação, feita para a disciplina de Sensoriamento Remoto do curso de Geografia.

Uma Terra 3D com oito satélites reais em órbita: **GEDI, ICESat-2, Landsat 9, Sentinel-2, Amazonia-1, Sentinel-1, NISAR e BIOMASS**. Cada satélite se abre para mostrar as peças, um laboratório animado explica o princípio físico (lidar, contagem de fótons, imageamento multiespectral, radar) e o último passo mostra o dado que chega ao usuário. A aula termina com os modelos de altura do dossel (GEDI + imagem + IA) e um desafio.

- **Aula:** `index.html`
- **Notas do professor:** `professor.html` (roteiro, tabela comparativa, respostas, glossário e fontes)

## Como apresentar

| Tecla | Ação |
|---|---|
| → ou Page Down | avança (funciona com passador de slides) |
| ← ou Page Up | volta |
| M | abre os capítulos |
| arrastar / roda do mouse | gira e aproxima a cena |

Clique em um satélite na visão geral para ir ao capítulo dele. Cada capítulo tem um endereço próprio, por exemplo `.../#gedi` ou `.../#nisar`.

## Usar sem internet

Baixe o repositório (Code → Download ZIP), descompacte e abra `index.html` no Chrome ou no Edge. As texturas e o Three.js estão na pasta; só as fontes vêm da internet.

## Estrutura

```
index.html          aula
professor.html      notas do professor
js/conteudo.js      textos, dados dos satélites e quiz (edite aqui)
js/modelos.js       satélites 3D procedurais
js/labs.js          laboratórios animados
js/app.js           cena, câmera e navegação
lib/three.min.js    Three.js r128 (licença MIT)
assets/             texturas da Terra (NASA Blue Marble e Black Marble, domínio público)
```

## Créditos

Dados dos satélites conferidos em novembro de 2026; as fontes estão em `professor.html`.
Three.js © 2010–2021 three.js authors, licença MIT. Texturas da Terra: NASA (domínio público), nas versões distribuídas com o pacote three-globe.

Canopy Forest · Cerrado
