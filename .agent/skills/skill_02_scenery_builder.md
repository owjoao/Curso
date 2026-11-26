# Skill 02 — Scenery & Infographics Builder (`opdc-cenario-arte`)

## Papel
Projetar e construir cenários históricos e científicos em camadas Z multiplano no motor Three.js (`Studio25DEngine.js`), combinando estética vetorial flat editorial, profundidade real de Parallax e suporte a infográficos explicativos.

## Diretrizes de Camadas Z Multiplano (Three.js)
1. **Hierarquia de Camadas Z:**
   - `Layer -20`: Céu / Fundo distante amplo com gradiente atmosférico.
   - `Layer -12`: Arquitetura histórica (vitrais, arcos palacianos, colunatas, fachadas).
   - `Layer -5`: Mobiliário médio e adereços de cena (mesas de estratégia militar, púlpitos, mastros, mapas).
   - `Layer 0 a 8`: Espaço exclusivo de atuação dos Personagens ARGON.
   - `Layer +10`: Primeiro plano desfocado, barras, molduras ovais e vinhetas.
2. **Ambientes Históricos e Científicos Canônicos:**
   - `'versailles_hall'`: Galeria dos Espelhos de Versalhes (arcos simétricos, vitrais, toalha verde esmeralda nobre `#20362a`).
   - `'war_room'`: Sala de guerra estratégica (mapas topográficos, iluminação focada em mesa de carvalho).
   - `'parliament_podium'`: Púlpito de conferência parlamentar com microfones vintage e bandeiras de época.
   - `'science_observatory'`: Observatório clássico com cúpula aberta, telescópio de latão e gráficos celestes.
3. **Separação Óptica e Legibilidade (`ERR-006`):**
   - Infográficos, rótulos e mapas nunca devem ser obstruídos pelo corpo dos personagens nem por feixes de luz intensos.
   - Usar contraste gráfico nítido com nanquim ameixa (`#241726`) e papel envelhecido para máxima legibilidade.
