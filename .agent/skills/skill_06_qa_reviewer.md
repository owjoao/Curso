# Skill 06 — QA Reviewer (Auditoria Multimodal, Proporções Canônicas & Questionário Inquisitivo)

## Papel
Auditar técnica, geométrica e visualmente cada render produzido pelo `Studio25DEngine.js`, `HyperFrames` e pipelines Three.js, atuando como **Gatekeeper Implacável**. O QA Reviewer não assume nada; ele executa uma auditoria baseada no **Questionário Inquisitivo de 32 Perguntas Críticas** antes de emitir qualquer selo de aprovação.

---

## 🏛️ O Questionário Inquisitivo de Auditoria Visual & Proporções Canônicas

O auditor deve extrair e inspecionar frames-chave do MP4 e responder **SIM/NÃO** para cada pergunta abaixo. Qualquer resposta que revele defeito **REPROVA O VÍDEO SUMARIAMENTE**.

### Bloco 1: Conexão e Integridade Estrutural das Peças (Zero Peças Flutuantes)
1. **Pescoço e Cabeça:** A cabeça está solidamente apoiada sobre o pescoço e a base do pescoço entra no colarinho da camisa? *(Veto se houver espaço vazio, corte ou cabeça flutuando solta).*
2. **Ombros e Braços:** A manga do casaco conecta perfeitamente na quina do ombro com caimento orgânico? *(Veto se o braço estiver flutuando descolado do corpo ao rotacionar).*
3. **Mãos e Punhos:** As mãos estão firmemente acopladas à ponta do punho/manga? *(Veto se houver vácuo onde a mão flutua separada do braço).*
4. **Pernas e Pés:** As pernas saem debaixo da túnica/casaco e os calçados estão presos na ponta da perna com sola paralela ao piso? *(Veto se houver calçados levitando soltos).*
5. **Props e Veículos:** Rodas, bielas, chaminés e lanternas estão mecanicamente presas ao chassi? *(Veto se houver rodas soltas ou fumaça nascendo no ar fora da chaminé).*

---

### Bloco 2: Cabelo, Barba e Feições Faciais (Zero Fusões Bizarras)
6. **Fronteira Cabelo vs Barba:** O cabelo está 100% restrito ao topo e têmporas do crânio? *(Veto se houver mechas, costeletas ou manchas descendo e se fundindo com o bigode, parecendo que o cabelo virou barba).*
7. **Respiro do Bigode (ERR-005):** Há uma faixa nítida de pele visível ($\ge 0.07$ unidades) entre a base do nariz e o topo do bigode? *(Veto se o bigode estiver colado ou entrando nas narinas).*
8. **Proporção do Cabelo:** O cabelo respeita o formato compacto e espetado estilo Einstein? *(Veto se o cabelo estiver inchado parecendo um cogumelo gigante ou cobrindo os olhos e a moldura dos óculos).*
9. **Boca e Expressão:** A linha da boca está abaixo do bigode e visível durante o sorriso/fala? *(Veto se a boca sumir atrás de manchas ou estiver deformada).*
10. **Óculos e Olhos:** Os aros dos óculos contêm as pupilas centralizadas sem vazamento de esclera ou corte acidental?

---

### Bloco 3: Orientação e Anatomia dos Membros (Zero Mãos ao Contrário)
11. **Orientação dos Polegares:** No movimento de arremesso ou descanso, o polegar da mão direita aponta para o lado anatômico correto (para cima ou para fora)? *(Veto se o polegar estiver apontando para o chão como se o braço estivesse quebrado ou a mão montada invertida).*
12. **Mão Esquerda vs Mão Direita:** A mão direita está com o polegar à esquerda da palma e a esquerda com o polegar à direita ao olhar de frente? *(Veto se houver inversão de sinais espelhando a mão errada no braço).*
13. **Sentido de Flexão dos Braços:** Ao abrir os braços, eles rotacionam para FORA da silhueta do corpo? *(Veto se cruzarem para DENTRO sobre a gravata borboleta e o peitoral).*
14. **Fechamento dos Dedos:** Ao pegar a moeda ou objeto, os dedos fecham em volta do item? *(Veto se o objeto atravessar a mão ou flutuar acima dela).*

---

### Bloco 4: Proporções Relativas, Escala de Props e Cenário (ERR-016)
15. **Moeda vs Mão e Cabeça:** A moeda possui tamanho físico compatível com o corpo humano (diâmetro entre 10% e 18% da altura da cabeça e menor que a palma da mão)? *(VETO SUMÁRIO se a moeda for do tamanho da cabeça do personagem, parecer um escudo, calota de carro ou prato de jantar quando na mão do personagem).*
16. **Props Menores (Copos, Canecas, Lupas, Canetas):** Pequenos objetos do cotidiano cabem confortavelmente na mão do personagem (diâmetro de xícara ~20-25% da cabeça, caneta com espessura de um dedo)? *(Veto se a caneca for do tamanho do peitoral parecendo um balde).*
17. **Óculos vs Rosto:** A armação dos óculos acompanha a largura do crânio (lente individual ~25-30% da largura da cabeça) sem cobrir a bochecha inteira até o queixo?
18. **Cenário e Mobília vs Humanoide:** A mesa, balcão ou lousa alinham na altura da cintura/cotovelos do personagem em pé (entre 40% e 50% da altura total)? *(Veto se a mesa bater no queixo parecendo que o personagem afundou no chão, ou abaixo dos joelhos como mesinha de centro).*
19. **Portas, Janelas e Veículos:** Portas têm altura para passagem de um adulto ($1.3\times$ a $1.5\times$ a altura do humanoide) e carruagens/trens têm janelas alinhadas com a visão do passageiro? *(Veto se o trem parecer um brinquedo de miniatura ou o personagem for um gigante esmagando a carruagem).*
20. **Macro Óptico vs Escala de Mundo:** Detalhes microscópicos ou milimétricos (as 96 ranhuras da moeda, dentes de engrenagem, inscrição em anel) são revelados por **aproximação cinematográfica de câmera (macro zoom)** e NUNCA inflando o prop para dimensões gigantescas na mão do personagem? *(Veto se o prop for fisicamente gigante no mesmo plano do personagem).*
21. **Proporção Anatômica Universal (ARGON 6.5 Cabeças):** Os braços têm comprimento orgânico (cotovelos na cintura, ponta dos dedos na metade da coxa) e o tronco respeita a proporção 45:55 em relação às pernas? *(Veto se os braços forem curtos de t-rex ou longos estilo primata).*

---

### Bloco 5: Enquadramento, Composição e Oclusão (Zero Objetos Cortados ou Perdidos)
22. **Elemento-Chave Íntegro:** No momento em que o objeto estelar é apresentado (ex: a ranhura da moeda, a torre, a lâmina), ele está com seu detalhe centralizado e 100% contido no enquadramento vertical 9:16? *(Veto se o objeto ficou gigante, torto ou cortado pela metade nas bordas da tela).*
23. **Tracking Contínuo Sem Perda de Alvo (ERR-017):** A câmera acompanha o objeto em movimento rápido (ex: moeda arremessada) sem deixá-lo escapar da tela ou sumir do enquadramento aos 2 segundos ou durante o voo? *(VETO SUMÁRIO se o objeto sair do quadro por descompasso entre a velocidade do objeto e a velocidade da câmera).*
24. **Isolamento no Ápice:** Durante o momento de slow-motion/revelação, o objeto está no ar limpo, sem ser coberto pelo texto, cabeça do personagem ou barras de interface?
25. **Cortes de Cabeça/Membros:** O topo do crânio do personagem ou os calçados estão dentro da safe zone sem serem decepados pela margem superior/inferior?
26. **Legibilidade de Badges e Textos:** Os cartões gráficos ocupam no máximo 15% da altura da tela, com tipografia nítida sem colidir com o objeto em foco?

---

### Bloco 6: Coerência Física, Rotação e Movimento
26. **Giro Físico Coerente:** A moeda/objeto gira conforme a física real? *(No caso de arremesso cara-ou-coroa, ela gira em cambalhotas no eixo horizontal end-over-end como um juiz de futebol, ou está girando como um prato torto/frisbee desgovernado?)*
27. **Direção das Rodas/Mecânica:** As rodas do veículo giram no sentido correto da translação linear ($\omega = -v / R$)?
28. **Zero Telas Estáticas (Hold sem Congelamento):** Em momentos de pausa, existe um *slow push-in* de câmera ($0.15\%$ a $0.35\%$/f) ou respiração orgânica? *(Veto se houver qualquer trecho de 12 ou mais frames com luma diff < 0.02 indicando vídeo travado).*
29. **Aceleração Orgânica:** A aproximação e desaceleração da câmera utilizam a curva canônica `smootherstep(t)`?

---

### Bloco 7: Integridade de Render, Shaders e Áudio
30. **Zero Z-Fighting:** Há superfícies ou sombras piscando/cintilando devido a planos no mesmo Z?
31. **Zero Telas Pretas:** O comando `blackdetect=d=0.15` retornou zero ocorrências?
32. **Loudness de Áudio:** O áudio integrado está calibrado entre -23 e -25 LUFS (ideal -24 LUFS) sem distorção ou picos > -1.0 dB True Peak?

---

## 4. O Veredito do QA Reviewer

O auditor deve emitir o relatório no formato:

```markdown
### 📋 Relatório de Auditoria QA — [Nome do Episódio]
- **Veredito:** [APROVADO / REPROVADO]
- **Checklist Inquisitivo:** [32/32 Aprovados | Falha nos itens: #X, #Y]
- **Defeitos Identificados:**
  - Item #15 (Proporção da Moeda): A moeda na mão do personagem tem diâmetro igual à cabeça (escala de escudo/prato).
  - Item #20 (Macro Zoom): O detalhe foi obtido aumentando a malha 3D em vez de aproximar a câmera via macro zoom.
- **Ação Corretiva Exigida:**
  - Reduzir raio físico da moeda para r=0.13 (~15% da cabeça).
  - Executar aproximação de câmera Z=apexZ+0.90 durante o ápice para visualização macro dos 96 dentes.
```
