# ToSho — Contexto do Projeto para Claude Code

Este arquivo é o documento de referência central do projeto ToSho. Deve ser lido no início de cada sessão de desenvolvimento antes de qualquer implementação.

> ⚠️ **Este é um projeto existente e funcional, não um projeto novo.**
> O app já está em produção com autenticação, Firebase e CRUD de compras funcionando. Este documento descreve o **estado alvo** — a interface redesenhada e as funcionalidades novas. Toda implementação é uma **evolução incremental** sobre o código existente.
>
> **Antes de escrever qualquer código, leia o código que já existe.** Ver seção 10.

---

## 1. Visão Geral do Produto

**ToSho** é uma aplicação web mobile-first de gerenciamento de listas de compras de supermercado. O objetivo é eliminar o esforço cognitivo de planejar, executar e controlar compras recorrentes.

**Usuário-alvo:** Pessoa que já usa lista informal (papel, bloco de notas ou WhatsApp) mas sofre com a reconstrução repetida da lista, falta de estrutura e perda de controle durante a compra.

**Escopo desta evolução:**
1. **Redesenhar a interface** seguindo o design system da seção 11
2. **Adicionar funcionalidades novas:** templates, entrada por texto livre, categorias automáticas, carrinho, busca e filtros
3. **Melhorar a qualidade do código** de forma oportunista, nos arquivos que já forem tocados

**Princípios de produto inegociáveis:**
1. Menor fricção possível na captura — adicionar item não pode custar mais de 2-3 toques
2. Operável com uma mão — toda interação crítica funciona com o polegar no mobile
3. O app trabalha mais do que o usuário — organização e estrutura são automáticas
4. Funcionar sem configuração inicial pesada — valor desde a primeira compra
5. Construível em partes independentes — cada feature tem valor por si só

---

## 2. Stack Técnica

```
Frontend:     React + TypeScript
Estilização:  Tailwind CSS
Componentes:  shadcn/ui (Radix + CVA + tailwind-merge)
Estado:       Redux Toolkit
Roteamento:   React Router v6
Backend:      Firebase (Firestore + Auth + Hosting)
Auth:         Firebase Authentication (e-mail/senha + Google OAuth)
```

> **Nota:** esta é a stack alvo. Verificar o que já está instalado no projeto antes de adicionar dependências — Tailwind e Redux Toolkit podem ou não já estar presentes.

> **shadcn/ui já é usado neste projeto.** Isso significa que os componentes base (Button, Input, Dialog, Toast, etc.) **não devem ser criados do zero** — devem ser **tematizados** com a paleta ToSho e usados. Ver seção 11.1.

---

## 3. Estrutura de Dados

> **Esta é a estrutura alvo.** A modelagem atual do Firestore é parcialmente compatível. Ver a estratégia de migração na seção 10 — a adaptação é gradual, coleção por coleção, conforme as HUs exigirem. Nunca fazer uma migração big-bang do banco.

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Timestamp;
}
```

### Purchase
```typescript
interface Purchase {
  id: string;
  userId: string;
  name: string;
  scheduledAt: Timestamp;
  isDone: boolean;          // false = pendente | true = concluída
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

> **Modelo de dois estados.** Não existe estado "em progresso" armazenado. Uma compra é pendente (`isDone: false`) ou concluída (`isDone: true`). A **compra ativa** é sempre derivada em tempo de leitura — a pendente com `scheduledAt` mais próximo de hoje — nunca persistida. Ver RN-06 e RN-07.
>
> Isso elimina a possibilidade de duas compras ficarem marcadas como ativas simultaneamente, e remove escritas desnecessárias no Firestore.
>
> **O codebase já usa `isDone`** — não há migração de dados a fazer neste campo.

### Purchase Item
```typescript
interface PurchaseItem {
  id: string;
  purchaseId: string;
  name: string;
  quantity?: string;
  description?: string;
  category: string;
  completed: boolean;
  createdAt: Timestamp;
}
```

### Template
```typescript
interface Template {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
}
```

### Template Item
```typescript
interface TemplateItem {
  id: string;
  templateId: string;
  name: string;
  quantity?: string;
  description?: string;
  category: string;
}
```

---

## 4. Regras de Negócio

### Domínio: Autenticação

**RN-01 — Confirmação de e-mail obrigatória**
Usuários cadastrados com e-mail e senha não podem acessar o app antes de confirmar o endereço. Acesso bloqueado com mensagem orientando verificação da caixa de entrada.

**RN-02 — Contas Google não exigem confirmação de e-mail**
Usuários autenticados via Google têm o e-mail considerado automaticamente válido.

**RN-03 — Bloqueio progressivo por tentativas de login**
Após 5 tentativas consecutivas com credenciais incorretas, acesso bloqueado por período crescente. Durante bloqueio, tentativas rejeitadas sem consultar o servidor.

**RN-04 — Persistência de sessão**
Sessão mantida entre acessos. Usuário não precisa autenticar novamente ao reabrir o app.

**RN-05 — Proteção de rotas autenticadas**
Nenhuma página é acessível sem sessão ativa. Tentativas redirecionam para login.

---

### Domínio: Compra Ativa

**RN-06 — Definição de compra ativa**
Compra ativa = a compra pendente (`isDone: false`) cujo `scheduledAt` é o mais próximo de hoje, incluindo compras com data passada ainda não concluídas. Como `scheduledAt` é um Timestamp com data e hora, a comparação por milissegundos já resolve o desempate por horário (RN-08).

**RN-07 — Compra ativa é derivada, nunca armazenada**
Não existe um campo de status "em progresso". A compra ativa é sempre calculada em tempo de leitura a partir de RN-06, por um helper centralizado (`getActivePurchase`). Nenhuma tela ou ação escreve esse estado no banco.

Consequências:
- Abrir a tela de compra ativa **não** altera nenhum dado
- É impossível duas compras serem ativas ao mesmo tempo
- Ao concluir a ativa, a próxima pendente mais próxima assume automaticamente, sem escrita adicional

**RN-08 — Desempate de compras com mesma data**
Quando duas compras caem no mesmo dia, o horário decide. Coberto automaticamente pela comparação de Timestamp em RN-06.

**RN-09 — Cálculo de progresso**
Progresso = itens concluídos / total de itens. Sempre derivado do estado atual dos itens, nunca armazenado — evita dessincronização. Atualizado em tempo real a cada marcação ou desmarcação.

**RN-10 — Registro de conclusão**
Ao concluir uma compra, definir `isDone: true` e registrar `completedAt` com a data e hora exata. `completedAt` é imutável após a conclusão.

**RN-11 — Compra ativa não pode ser excluída diretamente**
A compra ativa (determinada por RN-06) não pode ser excluída. A opção aparece desabilitada com indicação do motivo. O usuário deve concluí-la primeiro, ou alterar sua data para que outra compra assuma como ativa.

---

### Domínio: Itens

**RN-12 — Agrupamento automático por categoria**
Itens são sempre agrupados por categoria automaticamente. Usuário nunca organiza manualmente.

**RN-13 — Ordem fixa das categorias**
Categorias seguem ordem fixa pré-definida pelo sistema — não alfabética e não alterável pelo usuário. Novas categorias adicionadas pelo usuário são inseridas ao final da ordem fixa.
Categorias digitadas pelo usuário fora da lista fixa são preservadas como categorias independentes, inseridas na ordem imediatamente antes de "Outros". Qualquer seletor de categoria (edição de item, por exemplo) deve oferecer a união das categorias fixas com as categorias já em uso na compra ou template atual, para nunca perder uma categoria custom existente.

**Ordem fixa das categorias:**
```
1. Hortifruti
2. Padaria
3. Laticínios
4. Carnes e Aves
5. Peixes e Frutos do Mar
6. Frios e Embutidos
7. Mercearia
8. Massas e Cereais
9. Enlatados e Conservas
10. Bebidas
11. Congelados
12. Limpeza
13. Higiene e Beleza
14. Bebê
15. Pet
16. Outros
```

**RN-14 — Ordenação alfabética dentro da categoria**
Dentro de cada categoria, itens ordenados alfabeticamente. Aplicado automaticamente a cada adição ou edição.

**RN-15 — Categoria padrão para itens sem categoria**
Itens sem categoria informada são automaticamente atribuídos à categoria "Outros".

**RN-16 — Formato de entrada por texto livre**
Formato: `Nome, Categoria, Quantidade, Descrição` — separados por vírgula, um item por linha, estritamente posicional (sem adivinhação por conteúdo). Apenas nome é obrigatório. Campos do final podem ser omitidos (ex: só nome, ou nome + categoria), mas um campo do meio não pode ser pulado sem também informar os que vêm depois — a posição é o único critério. Linhas em branco são ignoradas silenciosamente.

**RN-17 — Itens duplicados são ignorados**
Itens com mesmo nome e categoria de um já existente são ignorados silenciosamente. Sem mensagem de erro.

**RN-18 — Marcação de item migra para o carrinho**
Mobile: item marcado migra da aba Lista para aba Carrinho. Desktop: item aparece no painel direito fixo. Desmarcação reverte.

---

### Domínio: Templates

**RN-20 — Clonagem de itens ao carregar template**
Itens clonados para a compra com todos os atributos preservados. Vínculo com template desfeito após clonagem. Alterações posteriores não se afetam mutuamente.

**RN-21 — Status dos itens clonados começa como pendente**
Todos os itens clonados começam com `completed: false`, independente do estado no template.

**RN-22 — Exclusão de template não afeta compras existentes**
Excluir template não remove nem altera itens de compras criadas a partir dele.

**RN-23 — Template pode ser criado sem itens**
Template salvo sem itens é válido. Itens podem ser adicionados posteriormente.

---

### Domínio: Interação e UX

**RN-24 — Ações destrutivas de itens usam toast com desfazer**
Exclusão de itens individuais (compra ou template) não exige confirmação prévia. Item removido imediatamente + toast de 5 segundos com opção "Desfazer". Após expirar, remoção definitiva.

**RN-25 — Ações destrutivas de entidades usam modal de confirmação**
Exclusão de compras e templates + conclusão de compra exigem modal de confirmação por serem irreversíveis e de maior impacto.

**RN-26 — Indicador de dois passos no modal de criação de compra**
Indicador de progresso (dois passos) só aparece quando "Carregar template" está selecionado. Para "Do zero" e "Compra anterior", modal permanece em passo único.

---

## 5. Fluxo do Usuário

### Abertura do app
```
Abre o app
├── Usuário autenticado?
│   ├── Não → tela de login/cadastro → Firebase Auth → verificação de compra pendente
│   └── Sim → verificação de compra pendente
│       ├── Tem compra pendente → vai para compra ativa (mais próxima de hoje)
│       └── Não tem → CTA para criar nova compra
```

### Navegação global
```
Topbar (desktop) / Bottom nav (mobile):
├── Compra atual
├── Compras
└── Templates
```

### Criar nova compra
```
Modal passo 1: nome + data e hora + ponto de partida
├── Do zero → cria compra vazia
├── Compra anterior → clona última compra concluída
└── Carregar template → passo 2: selecionar template → clona itens
```

### Compra ativa
```
Hero: nome, data/hora, badge status, barra de progresso
├── Mobile: abas Lista / Carrinho
└── Desktop: duas colunas (lista | carrinho)

Lista:
├── Busca em tempo real
├── Chips de filtro por categoria (rolagem horizontal)
├── Itens agrupados por categoria (ordem fixa)
│   └── Checkbox | Nome | Quantidade | Descrição | Editar | Excluir
└── FAB: Por template | Por texto livre | +

Carrinho:
├── Mobile: aba separada
└── Desktop: painel direito fixo com botão "Concluir compra" no topo
```

### Gerenciador de compras
```
Header: título + botão nova compra
Stats: cards de resumo (em progresso | pendentes | concluídas)
Seções:
├── Em progresso: compra ativa atual
├── Pendentes: ordenadas por data/hora crescente
└── Concluídas: ordenadas por data de conclusão decrescente
```

### Templates
```
Header: título + botão novo template
Grid de cards: nome | qtd itens | descrição | editar | excluir
Dentro do template:
├── Header: voltar | nome | qtd itens | editar
├── Busca
├── Itens agrupados por categoria
└── FAB: adicionar por texto livre
```

---

## 6. Histórias de Usuário — Ordem de Implementação

> **Cada HU é um diff sobre o código existente, não uma criação do zero.**
>
> Antes de começar, rodar o **Passo 0** e o **Passo 1** da seção 10:
> - **Passo 0:** sessão de inspeção — mapear o que já existe (sem escrever código)
> - **Passo 1:** implementar os componentes base do design system (`components/ui/`)
>
> Muitas HUs abaixo podem já estar parcial ou totalmente implementadas no código atual. A ordem das fases continua válida, mas o trabalho real de cada uma só é conhecido após a inspeção.

### Fase 1 — Autenticação (sem dependências)
- HU-01: Cadastro com e-mail e senha
- HU-02: Cadastro com Google
- HU-03: Login com e-mail e senha
- HU-04: Login com Google
- HU-05: Redirecionamento por estado de autenticação

### Fase 2 — Estrutura de compras
- HU-16: Criar nova compra
- HU-15: Visualizar todas as compras
- HU-18: Editar uma compra
- HU-19: Excluir uma compra

### Fase 3 — Compra ativa — visualização
- HU-06: Visualizar compra ativa
- HU-12: Buscar item na lista
- HU-13: Filtrar itens por categoria

### Fase 4 — Compra ativa — adição e edição
- HU-07: Adicionar itens por texto livre
- HU-10: Editar item da lista
- HU-11: Remover item da lista

### Fase 5 — Compra ativa — execução
- HU-09: Marcar item como concluído
- HU-14: Concluir compra
- HU-17: Acessar compra pendente ou concluída
- HU-20: Usar compra anterior como base

### Fase 6 — Templates — estrutura base (paralela às fases 2-5)
- HU-22: Criar template
- HU-21: Visualizar lista de templates
- HU-27: Editar informações do template
- HU-28: Excluir template

### Fase 7 — Templates — gestão de itens
- HU-23: Adicionar itens ao template
- HU-24: Buscar item no template
- HU-25: Editar item do template
- HU-26: Remover item do template

### Fase 8 — Integração templates + compras
- HU-29: Carregar template ao criar compra
- HU-08: Adicionar itens por template na compra ativa

---

## 7. Histórias de Usuário — Detalhamento Completo

### HU-01 — Cadastro com e-mail e senha
**Como** usuário, **quero** criar uma conta com meu nome, e-mail e senha **para** acessar o ToSho e ter minhas compras salvas de forma segura.

**Critérios de aceitação:**
- Formulário exige nome, e-mail e senha
- E-mail inválido exibe erro inline
- Senha < 8 caracteres exibe erro inline
- Senha ocultada por padrão com opção de revelar
- Após cadastro, usuário recebe e-mail de confirmação e é informado na tela
- Enquanto e-mail não confirmado, acesso bloqueado com mensagem orientando verificação
- E-mail já cadastrado exibe erro informando que conta já existe

---

### HU-02 — Cadastro com Google
**Como** usuário, **quero** criar uma conta usando minha conta do Google **para** não precisar criar e lembrar de uma senha nova.

**Critérios de aceitação:**
- Botão "Cadastrar com Google" inicia fluxo OAuth via Google
- Após autorização, usuário redirecionado para compra ativa
- Contas Google não exigem confirmação de e-mail
- E-mail Google já cadastrado via e-mail/senha vincula contas e autentica normalmente
- Erro no fluxo exibe mensagem genérica com opção de tentar novamente

---

### HU-03 — Login com e-mail e senha
**Como** usuário, **quero** entrar na minha conta com e-mail e senha **para** acessar minhas compras e dados salvos.

**Critérios de aceitação:**
- Formulário exige e-mail e senha
- Login bem-sucedido redireciona para compra ativa
- Credenciais incorretas exibem erro sem especificar qual campo — por segurança
- Senha ocultada por padrão com opção de revelar
- Após 5 tentativas incorretas, acesso bloqueado por período crescente com informação do tempo restante
- Durante bloqueio, tentativas rejeitadas sem consultar o servidor
- Sessão mantida entre acessos

---

### HU-04 — Login com Google
**Como** usuário, **quero** entrar na minha conta usando minha conta do Google **para** acessar o app sem digitar credenciais.

**Critérios de aceitação:**
- Botão "Entrar com Google" inicia fluxo OAuth via Google
- Após autenticação, redirecionado para compra ativa
- Conta Google não cadastrada cria conta automaticamente e redireciona
- Contas Google não exigem confirmação de e-mail
- Erro no fluxo exibe mensagem com opção de tentar novamente
- Sessão mantida entre acessos

---

### HU-05 — Redirecionamento por estado de autenticação
**Como** usuário, **quero** que o app identifique se já estou logado **para** não precisar fazer login toda vez.

**Critérios de aceitação:**
- Sessão ativa → redireciona direto para compra ativa
- Sem sessão → redireciona para login
- Páginas autenticadas inacessíveis sem sessão → redireciona para login

---

### HU-06 — Visualizar compra ativa
**Como** usuário, **quero** ver automaticamente minha compra mais próxima ao abrir o app **para** não precisar navegar para encontrá-la.

**Critérios de aceitação:**
- Sistema identifica automaticamente a compra pendente mais próxima de hoje
- Exibe nome, data/hora, badge de status e barra de progresso (concluídos/total)
- Sem compra pendente → exibe CTA para criar nova compra
- Itens agrupados automaticamente por categoria (ordem fixa RN-13)
- Dentro de cada categoria, itens em ordem alfabética

---

### HU-07 — Adicionar itens por texto livre
**Como** usuário, **quero** adicionar itens digitando em formato livre **para** registrar o que preciso sem preencher campos separados.

**Critérios de aceitação:**
- Botão "Por texto livre" abre campo de entrada
- Formato: Nome, Categoria, Quantidade, Descrição — vírgula, um item por linha
- Apenas nome obrigatório
- Sem categoria → "Outros"
- Múltiplos itens de uma vez, um por linha
- Itens aparecem imediatamente agrupados por categoria
- Campos inválidos e linhas em branco ignorados silenciosamente

---

### HU-08 — Adicionar itens por template na compra ativa
**Como** usuário, **quero** carregar itens de um template diretamente na compra ativa **para** adicionar rapidamente um conjunto de produtos.

**Critérios de aceitação:**
- Botão "Por template" abre painel com lista de templates disponíveis
- Usuário escolhe: carregar todos os itens ou selecionar itens específicos
- Itens carregados adicionados sem substituir os existentes
- Duplicatas (mesmo nome e categoria) ignoradas silenciosamente
- Itens aparecem imediatamente agrupados por categoria

---

### HU-09 — Marcar item como concluído
**Como** usuário, **quero** marcar um item como concluído ao pegá-lo **para** controlar o que já está no carrinho.

**Critérios de aceitação:**
- Toque no checkbox marca imediatamente sem confirmação
- Mobile: item migra para aba Carrinho
- Desktop: item aparece no painel direito fixo
- Barra de progresso atualizada imediatamente
- Desmarcar reverte — item volta para Lista
- Área de toque suficiente para polegar (mínimo 44px)

---

### HU-10 — Editar item da lista
**Como** usuário, **quero** editar um item já adicionado **para** corrigir ou atualizar suas informações.

**Critérios de aceitação:**
- Ícone editar abre formulário pré-preenchido
- Campos editáveis: nome, quantidade, descrição, categoria
- Apenas nome obrigatório
- Alterações refletidas imediatamente na lista
- Mudar categoria move item para grupo correto automaticamente

---

### HU-11 — Remover item da lista
**Como** usuário, **quero** remover um item da lista **para** excluir produtos que não preciso mais.

**Critérios de aceitação:**
- Ícone excluir remove imediatamente sem confirmação prévia
- Toast "Item removido" + opção "Desfazer" por 5 segundos
- "Desfazer" dentro do prazo restaura item na posição original
- Após toast expirar, remoção definitiva e irreversível
- Barra de progresso atualizada imediatamente

---

### HU-12 — Buscar item na lista
**Como** usuário, **quero** buscar item pelo nome **para** encontrá-lo rapidamente sem rolar por categorias.

**Critérios de aceitação:**
- Filtra em tempo real conforme usuário digita
- Case-insensitive e aceita correspondências parciais
- Itens não correspondentes ocultados temporariamente
- Categorias sem itens correspondentes ocultadas
- Limpar campo restaura lista completa

---

### HU-13 — Filtrar itens por categoria
**Como** usuário, **quero** filtrar a lista por categoria **para** focar no corredor onde estou.

**Critérios de aceitação:**
- Chips exibem apenas categorias presentes na lista ativa
- Chip "Todos" selecionado por padrão
- Selecionar categoria exibe apenas seus itens
- Apenas um filtro ativo por vez
- "Todos" restaura lista completa

---

### HU-14 — Concluir compra
**Como** usuário, **quero** concluir minha compra **para** registrá-la como finalizada e liberar a próxima.

**Critérios de aceitação:**
- Mobile: botão "Concluir compra" fixo no rodapé da tela
- Desktop: botão fixo no topo do painel direito do carrinho
- Exibe modal de confirmação antes de finalizar
- Após confirmação: `isDone: true` e `completedAt` registrado
- App identifica próxima compra pendente e a exibe como ativa
- Sem próxima compra → CTA para criar nova
- Compra concluída acessível no histórico

---

### HU-15 — Visualizar todas as compras
**Como** usuário, **quero** ver todas as compras organizadas por status **para** ter visão geral.

**Critérios de aceitação:**
- Três seções: Em progresso, Pendentes, Concluídas
- Card por compra: nome, data, hora, quantidade de itens
- Em progresso: no máximo uma compra
- Pendentes: ordenadas por data/hora crescente
- Concluídas: ordenadas por data de conclusão decrescente
- Topo exibe cards de resumo com contagem por status

---

### HU-16 — Criar nova compra
**Como** usuário, **quero** criar uma nova compra **para** planejar compras futuras.

**Critérios de aceitação:**
- Botão abre modal com campos: nome + data e hora
- Nome e data/hora obrigatórios — erro inline se ausentes
- Escolha de ponto de partida: do zero | carregar template | compra anterior
- "Carregar template" avança para segundo passo de seleção
- "Do zero" e "Compra anterior" criam direto sem segundo passo
- Indicador de dois passos só aparece quando "Carregar template" selecionado
- Compra aparece na seção correta após criação
- Compra ativa atual não é alterada

---

### HU-17 — Acessar compra pendente ou concluída
**Como** usuário, **quero** abrir uma compra específica **para** visualizar seus itens.

**Critérios de aceitação:**
- Toque no card direciona para tela de detalhes
- Compras pendentes exibem lista completa permitindo edição
- Compras concluídas exibem lista em modo somente leitura
- Compra ativa atual não é alterada

---

### HU-18 — Editar uma compra
**Como** usuário, **quero** editar nome e data/hora de uma compra **para** corrigir informações de planejamento.

**Critérios de aceitação:**
- Opção de editar via menu de contexto no card
- Formulário pré-preenchido com dados atuais
- Nome e data/hora obrigatórios
- Alterações refletidas imediatamente no card e na ordenação
- Nova data/hora mais próxima de hoje → compra passa a ser a ativa (no caso das pendentes, porque uma compra concluída mesmo que com data anterior às pendentes ou em progresso não muda o status, continua concluída)

---

### HU-19 — Excluir uma compra
**Como** usuário, **quero** excluir uma compra **para** manter o gerenciador organizado.

**Critérios de aceitação:**
- Opção de excluir via menu de contexto no card
- Modal de confirmação antes de remover
- Após confirmação, compra e itens removidos permanentemente
- A compra ativa (RN-06) não pode ser excluída — opção desabilitada com motivo visível
- Gerenciador e cards de resumo atualizados imediatamente

---

### HU-20 — Usar compra anterior como base
**Como** usuário, **quero** usar compra anterior como ponto de partida **para** reaproveitar itens recorrentes.

**Critérios de aceitação:**
- Selecionar "Compra anterior" usa automaticamente a compra concluída mais recente
- Todos os itens clonados com atributos preservados
- Status de todos os itens zerado para pendente
- Compra anterior não é alterada

---

### HU-21 — Visualizar lista de templates
**Como** usuário, **quero** ver todos os meus templates **para** ter visão geral dos modelos disponíveis.

**Critérios de aceitação:**
- Card por template: nome, quantidade de itens, descrição
- Ordenados por data de criação — mais recente primeiro
- Sem templates → CTA para criar o primeiro
- Desktop: grid de 3 colunas com card "Novo template" ao final

---

### HU-22 — Criar template
**Como** usuário, **quero** criar um template **para** ter modelo reutilizável para compras futuras.

**Critérios de aceitação:**
- Botão abre tela dedicada de criação
- Nome obrigatório — erro inline se ausente
- Descrição opcional
- Template pode ser salvo sem itens
- Itens agrupados automaticamente por categoria
- Template aparece imediatamente na lista após salvar

---

### HU-23 — Adicionar itens ao template
**Como** usuário, **quero** adicionar itens ao template **para** montar o modelo com produtos que sempre compro.

**Critérios de aceitação:**
- Botão "+" abre campo de texto livre
- Mesmo formato da compra ativa: Nome, Quantidade, Descrição, Categoria
- Apenas nome obrigatório — sem categoria → "Outros"
- Múltiplos itens de uma vez, um por linha
- Itens aparecem imediatamente agrupados por categoria
- Contagem total de itens atualizada após adição

---

### HU-24 — Buscar item no template
**Como** usuário, **quero** buscar item pelo nome no template **para** verificar se já está cadastrado.

**Critérios de aceitação:**
- Filtra em tempo real
- Case-insensitive e correspondências parciais
- Itens não correspondentes ocultados
- Categorias sem correspondência ocultadas
- Limpar campo restaura lista completa

---

### HU-25 — Editar item do template
**Como** usuário, **quero** editar item do template **para** corrigir informações sem removê-lo e readicioná-lo.

**Critérios de aceitação:**
- Ícone editar abre formulário pré-preenchido
- Campos: nome, quantidade, descrição, categoria
- Apenas nome obrigatório
- Alterações refletidas imediatamente
- Mudar categoria move item para grupo correto

---

### HU-26 — Remover item do template
**Como** usuário, **quero** remover item do template **para** manter modelo atualizado.

**Critérios de aceitação:**
- Remove imediatamente sem confirmação prévia
- Toast "Item removido" + "Desfazer" por 5 segundos
- "Desfazer" restaura item na posição original
- Após toast expirar, remoção definitiva
- Contagem total atualizada imediatamente

---

### HU-27 — Editar informações do template
**Como** usuário, **quero** editar nome e descrição do template **para** mantê-lo atualizado.

**Critérios de aceitação:**
- Ícone editar no header abre formulário pré-preenchido
- Nome obrigatório — erro inline se ausente
- Descrição opcional
- Alterações refletidas no card da lista e no header interno

---

### HU-28 — Excluir template
**Como** usuário, **quero** excluir template que não uso mais **para** manter lista organizada.

**Critérios de aceitação:**
- Ícone de lixeira no card
- Modal de confirmação antes de remover
- Template e itens removidos permanentemente
- Compras criadas a partir do template não são afetadas
- Lista de templates atualizada imediatamente

---

### HU-29 — Carregar template ao criar compra
**Como** usuário, **quero** selecionar template como ponto de partida ao criar compra **para** começar com lista pré-definida.

**Critérios de aceitação:**
- Selecionar "Carregar template" avança para segundo passo com lista de templates
- Cada template exibe nome, quantidade de itens e descrição
- Usuário seleciona template e confirma criação
- Itens clonados com atributos preservados
- Status de todos os itens zerado para pendente
- Template original não é alterado
- Indicador de dois passos aparece apenas quando "Carregar template" selecionado

---

## 8. Identidade Visual — Paleta de Cores

> **Para implementação, use os tokens HSL da seção 11.1** — é o formato que o shadcn consome. Os valores hex abaixo são a referência de origem.

```css
/* Cores principais */
--green-900: #085041;   /* hero, sidebar, topbar */
--green-700: #0F6E56;   /* botões primários, ícones, quantidade */
--green-500: #1D9E75;   /* badge em progresso, ícones secundários, barra progresso */
--green-300: #5DCAA5;   /* textos no hero, subtítulos */
--green-200: #9FE1CB;   /* bordas, ícones terciários */
--green-100: #C8EBE0;   /* bordas suaves, separadores */
--green-50:  #EDF7F3;   /* fundos de cards selecionados, badges pendente */
--green-25:  #F7FBF9;   /* fundo de inputs, chips inativos */

/* Textos */
--text-primary:   #0D2B22;   /* nomes de itens, títulos */
--text-secondary: #3D6B5A;   /* meta info, labels, descrições */
--text-tertiary:  #5D8A7A;   /* placeholders, textos de apoio */

/* Superfícies */
--surface-white: #FFFFFF;    /* cards de itens, modais */
--surface-page:  #FFFFFF;    /* fundo das páginas */
```

---

## 9. Convenções de Desenvolvimento

### Estrutura de pastas — alvo

Esta é a organização alvo. **O projeto já tem uma estrutura própria** — a migração para esta é gradual e oportunista: quando um arquivo for tocado por uma HU, mova-o para o lugar certo. Não fazer uma reorganização global de uma vez.

```
src/
├── components/
│   ├── ui/              # shadcn/ui — NÃO editar manualmente, usar `npx shadcn add`
│   ├── layout/          # topbar, bottom nav
│   ├── purchase/        # active purchase screen components
│   ├── purchases/       # purchase manager components
│   └── templates/       # template components
├── pages/               # one component per route
├── store/               # Redux store
│   └── slices/
├── services/            # Firebase calls
├── hooks/               # custom hooks
├── lib/
│   └── utils.ts         # cn() helper — convenção shadcn
├── utils/               # utility functions
│   └── categories.ts    # fixed category order (RN-13)
└── types/               # TypeScript interfaces
```

> `components/ui/` é território do shadcn. Componentes de lá são adicionados via CLI (`npx shadcn@latest add button`) e editados apenas para adicionar variants — nunca reescritos do zero. Componentes custom do ToSho vão nas outras pastas.

### Estrutura de pastas — atual (mapeada no Passo 0)

```
src/
├── app/
│   ├── shop/shopSlice.ts   # único slice Redux — só compra ativa
│   └── store.ts
├── assets/
│   ├── css/global.css      # só 1 regra (#root max-width) — irrelevante p/ tematização
│   └── images/
├── components/
│   ├── commom/              # sic — typo mantido consistente no projeto
│   │   ├── BlankState.tsx
│   │   ├── DecisionDialog.tsx  # modal de confirmação genérico (RN-25)
│   │   └── Header.tsx           # header único, sem diferenciação mobile/desktop
│   ├── form/                # wrappers de react-hook-form (FormInput, FormSelect, FormDatePicker, FormTextArea, ProductFormFooter)
│   ├── shop/                # ProductCard.tsx, ProductList.tsx
│   └── ui/                  # shadcn — ver seção 11.1 para o que falta
├── context/
│   └── commom/UserContext.tsx   # auth state via onAuthStateChanged
├── data/
│   ├── productCategories.ts  # dicionário chave→label, SEM ordem fixa (RN-13 não atendida)
│   └── productsCatalog.ts    # catálogo estático hardcoded
├── hooks/
│   └── hooks.ts              # useAppDispatch / useAppSelector tipados
├── layouts/
│   ├── PrivateLayout.tsx
│   └── PublicLayout.tsx
├── lib/
│   ├── firebase.ts
│   └── utils.ts               # cn()
├── pages/
│   ├── account/AccountPage.tsx
│   ├── auth/ (LoginForm, LoginPage, SignUpForm, SignUpPage, RecoveryPasswordForm, RecoveryPasswordPage)
│   ├── commom/LoadingPage.tsx
│   ├── completed-shops/ (CompletedShopCard, CompletedShopDetailPage, CompletedShopPriceCard, CompletedShopsPage)
│   ├── home/Home.tsx
│   └── shop/ (CompleteShopDialog, CurrentShopCreateDialog, CurrentShopPage, CurrentShopPriceCard, ProductEditPage)
├── routes/
│   ├── ProtectedRoute.tsx
│   ├── PublicRoute.tsx
│   └── routes.tsx
├── types/
│   └── index.ts               # só a interface Product
└── utils/
    ├── formValidations.ts     # todos os schemas Zod
    ├── formatDate.ts
    ├── formatPrice.ts
    └── handleProductsInput.ts # parser de texto livre (formato diferente do RN-16 alvo)
```

**Gap em relação à estrutura alvo:**
- **Sem `services/`** — chamadas Firestore (`getDocs`/`addDoc`/`updateDoc`/`deleteDoc`) ficam direto dentro de páginas e componentes (`Home.tsx`, `CurrentShopPage.tsx`, `ProductCard.tsx`, `ProductEditPage.tsx`, `CompletedShopsPage.tsx`).
- **`store/` não existe** — Redux vive em `app/`, precisa virar `store/slices/`.
- **Nomenclatura em português/domínio antigo**: `shop` em vez de `purchase`, `Product` em vez de `PurchaseItem`, `components/commom` (typo).
- **Sem `components/layout/`, `components/purchase/`, `components/purchases/`, `components/templates/`** — hoje tudo relacionado a compra ativa fica em `components/shop/` (só 2 arquivos) e o resto direto em `pages/shop/`.
- **`utils/categories.ts` (RN-13) não existe** — existe só `data/productCategories.ts`, sem ordem fixa.
- **Templates não existem em lugar nenhum** — nem pasta, nem arquivo.

### Convenções gerais
- Um componente por arquivo
- Nomes de componentes em PascalCase
- Nomes de funções e variáveis em camelCase
- **Código novo em inglês** (seção 3). Código existente em português migra gradualmente, junto com a HU que toca o arquivo — nunca em rename global
- Regras de negócio referenciadas nos comentários do código quando relevante (ex: `// RN-13 — fixed category order`)
- Cada HU implementada e testada no navegador antes de commitar
- **O app deve continuar funcionando a cada commit**

### Como usar este arquivo no Claude Code

Este é um **projeto existente**. Toda sessão começa lendo o código antes de escrevê-lo.

No início de cada sessão:
1. Peça para ler o CONTEXT.md
2. Informe a HU que será implementada
3. **Peça a exploração do código existente antes da implementação**
4. Cole os critérios de aceitação e as regras de negócio relacionadas
5. Anexe o print de referência visual da pasta `/design`

O template completo de prompt está no final da seção 10.

---

## 10. Estratégia de Implementação

### Contexto e decisão
Este é um projeto **existente e funcional em produção**, não uma reconstrução. O app já tem autenticação, integração com Firebase, roteamento e CRUD básico de compras funcionando. O objetivo desta evolução é:

1. **Primário:** redesenhar a interface seguindo o design system da seção 11
2. **Primário:** adicionar as funcionalidades novas descritas nas HUs (templates, texto livre, categorias, carrinho, etc.)
3. **Secundário:** melhorar a qualidade do código *no caminho* — enquanto se mexe em cada arquivo

**Decisão:** evolução incremental sobre o codebase existente. Nada de reescrita do zero.

**Por quê:** o app funciona. Reconstruir significaria reescrever auth, Firebase e roteamento — que já estão testados no mundo real — apenas para voltar ao ponto de partida antes de entregar qualquer valor novo. A refatoração incremental entrega valor a cada sessão: a interface nova aparece tela por tela, as features novas entram uma por uma, e a limpeza de código acontece naturalmente porque a maioria dos arquivos vai ser tocada de qualquer forma na troca de UI.

---

### Regra fundamental para o Claude Code

**Antes de escrever qualquer código para uma HU, leia o código existente do módulo correspondente.**

Toda HU é um **diff sobre o que existe**, não uma criação do zero. A primeira pergunta de cada sessão deve ser sempre:

> "O que já existe aqui, o que precisa mudar, e o que pode ser mantido?"

Ordem de trabalho em cada sessão:
1. Explorar os arquivos relevantes do módulo
2. Reportar o que encontrou: o que já atende a HU, o que precisa mudar, o que está faltando
3. Propor o plano de mudança antes de implementar
4. Implementar

Nunca criar um arquivo novo se já existe um equivalente — editar o existente.

---

### Princípios de refatoração incremental

**1. Refatorar apenas o que se toca**
Não abrir frentes de refatoração que não estão no caminho da HU atual. Se um arquivo não precisa mudar para a HU, não mexer nele.

**2. Manter o app funcionando a cada commit**
Nenhum commit deve deixar o app quebrado. Se uma mudança grande for necessária, quebrá-la em passos menores que mantenham o build passando.

**3. Melhorar a qualidade no caminho**
Ao editar um arquivo, aplicar as melhorias óbvias: tipagem faltando, nomes confusos, lógica duplicada, componentes grandes demais. Mas sem transformar isso em um projeto paralelo.

**4. Nomenclatura em inglês para código novo**
Código novo segue a nomenclatura em inglês definida na seção 3. Código existente em português pode ser migrado gradualmente, priorizando os arquivos que já estão sendo modificados pela HU atual. Não fazer um rename global de uma vez.

**5. Firestore: adaptar, não substituir**
A modelagem atual é parcialmente compatível com a estrutura da seção 3. A estratégia é:
- Coleções compatíveis: manter, adicionar campos novos conforme necessário
- Coleções incompatíveis: migrar quando a HU correspondente exigir, com script de migração de dados
- Nunca fazer uma migração big-bang de todo o banco

---

### Estratégia de migração do Firestore

Antes de iniciar cada fase que toque em dados, verificar a compatibilidade da coleção correspondente:

> **Nota de path:** as coleções atuais são subcoleções aninhadas em `users/{userId}`, não coleções raiz — `users/{userId}/shops/{shopId}/products/{productId}`. A estrutura alvo (seção 3) não especifica o path, só o shape do documento; manter o aninhamento é compatível.

| Coleção (atual → alvo) | Estrutura alvo (seção 3) | Campos que existem | Campos que faltam | Campos que mudam de nome/tipo |
|---|---|---|---|---|
| `users` → `users` | `User` | `name`, `email` | `id` (implícito no doc id, ok), `createdAt` | — |
| `shops` → `purchases` | `Purchase` | `name`, `date` (Timestamp), `isDone` (boolean), `total` (number) | `userId` (hoje só implícito no path), `scheduledAt`, `createdAt`, `completedAt` | `date` → renomeia para `scheduledAt`; **`isDone` PERMANECE como está** — o modelo de dois estados é o alvo (RN-07), não há migração de status a fazer; `total` (preço) não existe no modelo alvo — feature de preço fica fora do escopo desta evolução, decidir se remove ou mantém como campo extra |
| `products` → `purchase items` | `PurchaseItem` | `name`, `quantity` (number), `category` (string livre), `description` (opcional), `isDone` (boolean), `price` (number, opcional) | `purchaseId` (implícito no path), `createdAt` | `isDone` → `completed`; `quantity: number` → `quantity?: string`; `category` hoje é chave livre sem ordem fixa — precisa migrar valores para o enum/ordem fixa da RN-13; `price` não existe no modelo alvo |
| — → `templates` | `Template` | não existe | `id`, `userId`, `name`, `description`, `createdAt` | ➕ coleção nova |
| — → `template items` | `TemplateItem` | não existe | `id`, `templateId`, `name`, `quantity`, `description`, `category` | ➕ coleção nova |

Quando um campo precisar ser adicionado a documentos existentes, escrever um script de migração único, rodá-lo uma vez, e documentar no commit.

---

### Helper canônico: compra ativa

Já existe no projeto e implementa RN-06 e RN-08 corretamente. **Reusar sempre — nunca reimplementar a lógica de "qual é a compra ativa" em outro lugar.**

```typescript
export function getActivePurchase<T extends ActivePurchaseCandidate>(
  purchases: T[]
): T | undefined {
  const pending = purchases.filter((purchase) => !purchase.isDone);

  return pending.reduce<T | undefined>((closest, purchase) => {
    const purchaseMillis = (purchase.scheduledAt ?? purchase.date)?.toMillis() ?? Infinity;
    const closestMillis = (closest?.scheduledAt ?? closest?.date)?.toMillis() ?? Infinity;

    return purchaseMillis < closestMillis ? purchase : closest;
  }, undefined);
}
```

Dois pontos a revisar quando houver oportunidade (nenhum urgente):
- O fallback `?? Infinity` faz uma compra sem data nunca ser escolhida como ativa, mesmo sendo a única pendente
- O `scheduledAt ?? date` reflete dois nomes para o mesmo campo no banco — unificar em `scheduledAt`

---

### Mapeamento do que existe vs o que muda

> **Esta tabela deve ser preenchida após inspeção do código atual, antes de iniciar a Fase 1.** Peça ao Claude Code para explorar o projeto e preencher com o que encontrar.

| Módulo | Status atual | O que muda | HUs afetadas |
|---|---|---|---|
| Autenticação — e-mail/senha | 🔧 | `LoginForm.tsx`/`SignUpForm.tsx` já cobrem form + validação Zod + Firebase Auth. Falta: confirmação de e-mail obrigatória (RN-01, nenhum `sendEmailVerification`/`emailVerified` no código) e bloqueio progressivo por tentativas (RN-03, nenhuma lógica de tentativas/lockout) | HU-01, HU-03 |
| Autenticação — Google OAuth | ➕ | Não existe — nenhuma ocorrência de `GoogleAuthProvider`/`signInWithPopup` no projeto. Implementar do zero, incluindo RN-02 (sem exigência de confirmação de e-mail) | HU-02, HU-04 |
| Guards de rota / redirecionamento | ✅ | `ProtectedRoute.tsx`/`PublicRoute.tsx` já cobrem RN-04/RN-05 via `onAuthStateChanged` no `UserContext`. Nenhuma mudança necessária | HU-05 |
| Redux — estrutura de estado | 🔧 | `shopSlice.ts` (em `app/`, não `store/`) cobre só a compra ativa. Falta slice/estado para lista de compras (Fase 2) e templates (Fases 6-7); mover pasta `app/` → `store/slices/` | todas |
| Firestore — modelagem | 🔧 | Ver tabela de migração acima — `isDone` permanece (RN-07), `date`→`scheduledAt`, `quantity` muda de tipo, categorias sem ordem fixa, `templates`/`template items` não existem | todas |
| Criar / listar / editar / excluir compra | 🔧 | Criar: `CurrentShopCreateDialog.tsx` só pede nome+data (falta hora e as 3 opções de ponto de partida + indicador de passos). Listar: `CompletedShopsPage.tsx` só lista **concluídas** — não existe tela com as 3 seções (Em progresso/Pendentes/Concluídas) nem cards de resumo. Editar: **não existe** nenhuma tela/fluxo de edição de compra. Excluir: existe em `CompletedShopsPage.tsx` (`removeShop`), mas sem checar RN-11 (a compra ativa não pode ser excluída) | HU-15 a HU-19 |
| Compra ativa — lista de itens | 🔧 | `CurrentShopPage.tsx` + `ProductList.tsx` + `ProductCard.tsx` cobrem exibição, agrupamento e CRUD básico. Falta: ordem fixa de categorias (RN-13 — hoje é ordem de inserção do objeto JS), ordenação alfabética dentro da categoria (RN-14), `quantity` como string livre (hoje é `number`) | HU-06, HU-07, HU-10, HU-11 |
| Compra ativa — carrinho | 🎨 | Migração de item entre Lista/Carrinho ao marcar checkbox já funciona (`toggleProductStatus` em `ProductCard.tsx`), RN-18 já atendida em essência via abas (`Tabs`). Falta layout desktop em duas colunas (hoje só abas, sem versão responsiva) e botão "Concluir compra" fixo — não existe fluxo de conclusão de compra | HU-09, HU-14 |
| Categorias e agrupamento | 🔧 | `productCategories.ts` é só um dicionário chave→label sem ordem; `ProductList.tsx` agrupa via `reduce` na ordem de inserção dos produtos, não na ordem fixa da RN-13 | HU-06, RN-12/13/14 |
| Busca e filtros | ➕ | Não existe nenhum campo de busca nem chips de filtro por categoria em nenhuma tela | HU-12, HU-13 |
| Entrada por texto livre | 🔧 | `handleProductsInput.ts` já faz parsing multi-linha por vírgula, mas formato é `Nome, Quantidade, Descrição` (categoria sempre fixa em `'others'`) em vez do alvo `Nome, Quantidade, Descrição, Categoria` (RN-16); `quantity` vira `number`, alvo pede string opcional; duplicados (RN-17) não são filtrados | HU-07 |
| Templates | ➕ | Não existe nada — nem página, componente, slice ou coleção Firestore | HU-21 a HU-29 |
| Toast / desfazer | 🔧 | `Toast`/`useToast` (Radix) existe e é usado para mensagens pontuais de sucesso/erro. RN-24 (remoção imediata + toast "Desfazer" 5s) não implementada — remoção de item hoje passa por `DecisionDialog` (modal de confirmação), padrão que deveria ficar só para RN-25 | RN-24 |
| shadcn — componentes instalados | 🔧 | Instalados: avatar, button, calendar, checkbox, dialog, dropdown-menu, form, input, label, popover, progress, select, separator, sheet, skeleton, tabs, textarea, toast/toaster. Faltam: `Badge`, `AlertDialog`, `Drawer` (vaul), `ToggleGroup`; `Sonner` sugerido pela seção 11.1 não está instalado (projeto usa Toast/Toaster clássico do Radix) | todas |
| shadcn — tematização (tokens) | 🔧 | Tailwind é v3 (confirmado). Tokens em `src/index.css` estão incompletos e em formato **misto**: maioria em HSL triplet consumido como `hsl(var(--x))`, mas `--primary`/`--secondary`/`--accent`/`--warning`/`--error`/`--success` estão em hex puro e consumidos como `var(--x)` direto no `tailwind.config.js`. Paleta atual não é a paleta ToSho da seção 8. Substituição completa é o Passo 1 | todas |
| Design system / UI | ➕ | Não há Topbar/Bottom nav responsivos — existe só um `Header.tsx` único e fixo (mesmo visual mobile/desktop) com avatar+dropdown. Hero, cards de item, chips, FAB expansível da seção 11.2 não existem — tudo a construir | todas |

Legenda para preenchimento:
- ✅ **Existe e atende** — nenhuma mudança necessária
- 🔧 **Existe, precisa ajuste** — descrever o que muda
- 🎨 **Existe, só muda UI** — lógica mantida, interface redesenhada
- ➕ **Não existe** — implementar do zero

---

### Ordem de trabalho

**Passo 0 — Inspeção inicial (uma vez, antes de tudo)**
Sessão dedicada para o Claude Code explorar o projeto e preencher as duas tabelas acima. Sem escrever código.

**Passo 1 — Tematizar o shadcn/ui**
O projeto já usa shadcn/ui. **Não criar componentes base do zero.** O trabalho é:
1. Mapear a paleta ToSho nas CSS variables do shadcn (`globals.css` / `index.css`) — tokens prontos na seção 11.1
2. Instalar os componentes shadcn que ainda faltam (ver tabela da seção 11.1)
3. Ajustar variantes do `Button` e `Badge` para cobrir os casos do design system (pill, status)

Isso desbloqueia todas as HUs de UI e evita retrabalho. Fazer antes de qualquer HU.

**Passo 2 — Seguir as fases da seção 6**
As 8 fases continuam válidas como ordem de trabalho. A diferença é que cada HU agora começa com uma leitura do que existe.

**Passo 3 — Uma HU por sessão, um commit por HU**
Testar no navegador antes de commitar. O app deve continuar funcionando a cada commit.

---

### Convenção de commits

Use prefixos que deixem claro a natureza da mudança:

```
[HU-XX] feat: descrição da funcionalidade nova
[HU-XX] refactor: descrição da mudança estrutural
[HU-XX] ui: descrição da mudança visual
[HU-XX] fix: descrição da correção

Exemplos:
[HU-01] ui: redesign register screen with new design system
[HU-07] feat: add free text item input with multi-line parsing
[HU-06] refactor: extract category grouping into utils
[HU-09] feat: add checkbox to mark item as completed
[setup] feat: add base UI components (Button, Input, Card)
```

---

### Template de prompt de sessão

```
Leia o CONTEXT.md na raiz do projeto.

Vou implementar a HU-07 — Adicionar itens por texto livre.

Antes de escrever código:
1. Explore o código existente relacionado à adição de itens na compra
2. Me diga o que já existe, o que precisa mudar e o que falta
3. Proponha o plano de mudança

Critérios de aceitação: [cole os critérios]
Regras de negócio: RN-12, RN-13, RN-14, RN-15, RN-16, RN-17
Referência visual: [anexe design/05-active-purchase-app.png e design/08-active-purchase-web.png]

Só implemente depois que eu aprovar o plano.
```

---

## 11. Design System — Componentes Base

Esta seção descreve os padrões visuais que se repetem em todas as telas. Todo componente novo deve seguir esses padrões antes de qualquer customização específica de tela.

Os prints do protótipo de cada tela estão na pasta `/design` na raiz do projeto e devem ser anexados como referência visual nas sessões do Claude Code.

---

## 11.1 — shadcn/ui: Tematização e Mapeamento

> **Regra de ouro:** nunca criar do zero um componente que o shadcn já oferece. Tematizar e usar.
>
> Corolário: nunca sobrescrever cores com classes utilitárias em cada uso (`className="bg-[#0F6E56]"`). Se a cor está certa nos tokens, o componente já nasce certo. Sobrescrita é sinal de que a tematização está incompleta.

### Verificações antes de começar

Na sessão de inspeção (Passo 0), confirmar:
- [ ] Versão do Tailwind — **v3** (tokens em `:root` no `globals.css`) ou **v4** (`@theme` inline). A sintaxe de tematização difere.
- [ ] Onde está o arquivo de tokens (`globals.css`, `index.css`, ou `app.css`)
- [ ] Quais componentes shadcn já estão instalados em `components/ui/`
- [ ] Se `cn()`, `class-variance-authority` e `tailwind-merge` já existem

---

### Tokens da paleta ToSho (HSL, formato shadcn)

Substituir o bloco de tokens existente no arquivo de CSS global:

```css
:root {
  /* Base */
  --background: 0 0% 100%;              /* #FFFFFF */
  --foreground: 162 53.6% 11%;          /* #0D2B22 — text-primary */

  /* Primário — botões, ações principais */
  --primary: 164.8 76% 24.5%;           /* #0F6E56 */
  --primary-foreground: 159 50% 92.2%;  /* #E1F5EE */

  /* Secundário — superfícies suaves, cards selecionados */
  --secondary: 156 38.5% 94.9%;         /* #EDF7F3 — green-50 */
  --secondary-foreground: 167.5 81.8% 17.3%; /* #085041 */

  /* Muted — inputs, chips inativos, textos de apoio */
  --muted: 150 33.3% 97.6%;             /* #F7FBF9 — green-25 */
  --muted-foreground: 157.8 27.4% 32.9%; /* #3D6B5A — text-secondary */

  /* Accent — hover states, destaques */
  --accent: 156 38.5% 94.9%;            /* #EDF7F3 */
  --accent-foreground: 167.5 81.8% 17.3%; /* #085041 */

  /* Destructive — exclusões */
  --destructive: 0 72.2% 50.6%;         /* #DC2626 */
  --destructive-foreground: 0 0% 100%;

  /* Bordas e inputs */
  --border: 161.1 46.7% 85.3%;          /* #C8EBE0 — green-100 */
  --input: 161.1 46.7% 85.3%;           /* #C8EBE0 */
  --ring: 160.9 69% 36.7%;              /* #1D9E75 — focus ring */

  /* Cards */
  --card: 0 0% 100%;
  --card-foreground: 162 53.6% 11%;

  /* Popover / Dialog */
  --popover: 0 0% 100%;
  --popover-foreground: 162 53.6% 11%;

  --radius: 0.75rem;                    /* 12px — base do design system */
}
```

**Cores do ToSho sem equivalente semântico no shadcn** — adicionar como tokens custom no mesmo bloco e expor no Tailwind config:

```css
:root {
  /* ... tokens acima ... */

  /* ToSho — escala verde completa */
  --tosho-900: 167.5 81.8% 17.3%;  /* #085041 — hero, topbar */
  --tosho-700: 164.8 76% 24.5%;    /* #0F6E56 — botões */
  --tosho-500: 160.9 69% 36.7%;    /* #1D9E75 — badge, progresso, aba ativa */
  --tosho-300: 159.6 50.7% 57.8%;  /* #5DCAA5 — texto no hero */
  --tosho-200: 160 52.4% 75.3%;    /* #9FE1CB — ícones terciários */
  --tosho-100: 161.1 46.7% 85.3%;  /* #C8EBE0 — bordas */
  --tosho-50:  156 38.5% 94.9%;    /* #EDF7F3 — superfícies */
  --tosho-25:  150 33.3% 97.6%;    /* #F7FBF9 — inputs */

  --tosho-hero-fg: 159 50% 92.2%;  /* #E1F5EE — texto sobre verde escuro */
  --tosho-text-3:  158.7 19.5% 45.3%; /* #5D8A7A — placeholders */
}
```

> **Tailwind v4:** os tokens custom vão em `@theme` em vez de `:root`, no formato `--color-tosho-900: hsl(167.5 81.8% 17.3%)`. Confirmar a versão antes de escrever.

---

### Mapeamento: design system → shadcn

| Elemento do design system | Componente shadcn | Observação |
|---|---|---|
| Botão primário (solid) | `Button` variant `default` | já nasce com `--primary` |
| Botão secundário (outline) | `Button` variant `outline` | |
| Botão pill pequeno (concluir) | `Button` — **nova variant `pill`** | `rounded-full`, `text-xs`, `px-3.5 py-1.5` |
| Botão Google OAuth | `Button` variant `outline` + ícone | |
| Input de formulário | `Input` + `Label` | usar `Form` (react-hook-form + zod) para validação e erro inline |
| Erro inline de validação | `FormMessage` | vem de graça com `Form` |
| Checkbox do item | `Checkbox` | customizar tamanho para 28px e `rounded-lg` |
| Chips de filtro por categoria | `ToggleGroup` type `single` | ou `Badge` clicável — `ToggleGroup` dá o comportamento de seleção única (RN: um filtro por vez) |
| Badge de status (compra) | `Badge` — **novas variants** | `active` (derivado, RN-06), `pending`, `completed` |
| Abas Lista / Carrinho (mobile) | `Tabs` | customizar `TabsTrigger` ativo: `text-tosho-500` + `border-b-tosho-500` |
| Modal de confirmação — desktop | `AlertDialog` | RN-25 — semanticamente correto para confirmação destrutiva |
| Modal / bottom sheet — mobile | `Drawer` (vaul) | RN-25 — bottom sheet nativo |
| Modal de criar compra | `Dialog` (desktop) + `Drawer` (mobile) | formulário, não confirmação |
| Toast com desfazer | `Sonner` | RN-24 — `toast("Item removido", { action: { label: "Desfazer", onClick: undo }, duration: 5000 })` |
| Menu de contexto do card | `DropdownMenu` | editar / excluir compra e template |
| Campo de busca | `Input` + ícone | wrapper simples |
| Card de compra / template | `Card` | ou `div` com as classes — avaliar |
| Select de categoria (edição) | `Select` | |
| Date/time picker (criar compra) | `Popover` + `Calendar` | |
| Indicador de 2 passos | custom | RN-26 — 3 linhas de div, não vale componente |

### Componentes que permanecem custom

Específicos demais para virarem componente de biblioteca. Implementar em `components/purchase/` e `components/layout/`:

- **Hero da compra ativa** — nome, badge, barra de progresso, abas
- **Card de item** — checkbox + info + ações, com estados pendente/concluído
- **FAB expansível** — botão + pills "Por template" / "Por texto livre"
- **Bottom nav** (mobile) e **Topbar** (desktop)
- **Barra de progresso do hero** — `Progress` do shadcn é uma opção, mas o visual sobre fundo verde escuro pode não valer o esforço de tematizar. Avaliar.

---

### Variants novas a criar

**`Button` — variant `pill`:**
```tsx
pill: "rounded-full bg-primary text-primary-foreground text-xs font-medium px-3.5 py-1.5 hover:bg-primary/90"
```

**`Badge` — variants de status:**
```tsx
"active":    "bg-tosho-500 text-tosho-hero-fg border-transparent",  // compra ativa (derivada, RN-06)
"pending":   "bg-tosho-50 text-tosho-900 border-transparent",       // demais pendentes
"completed": "bg-tosho-25 text-muted-foreground border-border",     // isDone: true
```

---

## 11.2 — Especificações Visuais Detalhadas

As especificações abaixo descrevem os valores exatos de cada elemento. Onde houver um componente shadcn equivalente (tabela 11.1), essas specs servem para **tematizar** o componente, não para reimplementá-lo.

---

### Topbar (desktop)
```
bg: #085041
height: 52px
padding: 0 32px
layout: flex, items-center, gap-8

Logo: ícone shopping-cart (#5DCAA5) + texto "ToSho" (16px, 500, #E1F5EE)

Nav items: flex, gap-1
  - Default: text 13px #9FE1CB, padding 8px 14px, rounded-lg
  - Active:  bg rgba(255,255,255,0.12), text #E1F5EE

Avatar: 30px, rounded-full, bg #1D9E75, texto 12px 500 #E1F5EE
Username: 13px #9FE1CB
```

### Bottom nav (mobile)
```
bg: #FFFFFF
border-top: 0.5px solid #C8EBE0
padding: 6px 0 8px

Nav items: flex, flex-1, flex-col, items-center, gap-1, padding 4px 0
  - Default: text 10px #5D8A7A, ícone 22px
  - Active:  text/ícone #085041 + pip (4px circle bg #085041 abaixo do label)
```

---

### Hero da compra ativa
```
bg: #085041
padding: 20px 20px 0 (mobile) | 24px 32px 0 (desktop)

Nome da compra: 20-22px, 500, #E1F5EE
Meta (data/hora): 12-13px, #E1F5EE, margin-top 3px
Badge de status: bg #1D9E75, text #E1F5EE, 11px 500, padding 4px 10-12px, rounded-full

Barra de progresso:
  - Label "Progresso": 11px #E1F5EE
  - Valor "X de Y itens": 11px 500 #E1F5EE
  - Track: height 5px, bg rgba(255,255,255,0.15), rounded
  - Fill:  height 5px, bg #1D9E75, rounded

Abas Lista/Carrinho (mobile apenas):
  - Container: flex, margin-top 16px
  - Default: text 13px rgba(255,255,255,0.4), border-bottom 2.5px transparent
  - Active:  text #1D9E75, font 500, border-bottom 2.5px #1D9E75
```

---

### Card de item (Lista)
```
bg: #FFFFFF
border: 0.5px solid #C8EBE0
border-radius: 14px
padding: 12px 14px
layout: flex, items-center, gap-12px

Estado concluído:
  bg: #F7FBF9 (card inteiro)

Checkbox (substitui ícone de categoria):
  size: 28x28px
  border-radius: 8px
  Default: bg #EDF7F3, border 1px #C8EBE0, check-icon 16px #C8EBE0
  Marcado: bg #0F6E56, border #0F6E56, check-icon 18px #E1F5EE

Conteúdo do item (flex-1):
  Nome: 14px, 500, #0D2B22
  Nome concluído: 14px, 500, #1D9E75, line-through
  Quantidade: 12px, 500, #0F6E56 | concluído: #1D9E75
  Descrição: 12px, #3D6B5A

Ações (flex-shrink-0):
  Ícones editar + excluir: 17px, #1D9E75
  Ícone desfazer (carrinho): 17px, #1D9E75
```

---

### Label de categoria
```
font-size: 11px
font-weight: 500
color: #3D6B5A
text-transform: uppercase
letter-spacing: 0.5px
margin-bottom: 8px
margin-top: 4px (quando não é o primeiro grupo)
```

---

### Chips de filtro por categoria
```
layout: flex, gap-6px, overflow-x auto (mobile) | flex-wrap (desktop)
padding-bottom: 16px

Chip default: bg #F7FBF9, text #3D6B5A, border 0.5px #C8EBE0, 12px 500, padding 5px 12-14px, rounded-full
Chip ativo:   bg #085041, text #E1F5EE, sem border, mesmas dimensões
```

---

### Campo de busca
```
layout: flex, items-center, gap-8px
bg: #F7FBF9
border: 0.5px solid #C8EBE0
border-radius: 12px
padding: 10px 14px
margin-bottom: 14px

Ícone search: 17px, #1D9E75
Placeholder: 13px, #5D8A7A
```

---

### Botões flutuantes — FAB (mobile)
```
layout: flex, justify-end, items-center, gap-8px
padding: 12px 20px 14px
border-top: 0.5px solid #C8EBE0
bg: #FFFFFF

Pills (Por template / Por texto livre):
  bg: #F7FBF9
  border: 0.5px solid #C8EBE0
  padding: 10px 16px
  border-radius: 20px
  font: 12px 500 #085041
  white-space: nowrap

Círculo principal (+/x):
  size: 44px
  border-radius: 50%
  bg: #0F6E56
  ícone: 20px #E1F5EE
```

---

### Botões (geral)
```
Primário (solid):
  bg: #0F6E56
  text: #E1F5EE, 14px, 500
  padding: 13-14px
  border-radius: 12px
  width: 100% (em modais e formulários)

Primário pequeno (pill):
  bg: #0F6E56
  text: #E1F5EE, 12px, 500
  padding: 7px 14px
  border-radius: 20px

Secundário (outline):
  bg: #FFFFFF
  border: 0.5px solid #C8EBE0
  text: #085041, 14px
  padding: 13px
  border-radius: 12px
  width: 100%

Google OAuth:
  igual ao secundário + ícone Google (#0F6E56) à esquerda
```

---

### Inputs de formulário
```
bg: #F7FBF9
border: 0.5px solid #C8EBE0
border-radius: 12px
padding: 12px 14px 12px 40px (com ícone) | 12px 14px (sem ícone)
font: 14px, #085041

Label acima do input:
  font: 11px, 500, #0F6E56
  text-transform: uppercase
  letter-spacing: 0.4px
  margin-bottom: 6px

Ícone prefixo: 17px #1D9E75, posição absoluta left 13px
Ícone sufixo (olho): 17px #1D9E75, posição absoluta right 13px

Erro inline: 12px, vermelho (use red-500 do Tailwind), margin-top 4px
```

---

### Cards de compra/template (gerenciador)
```
bg: #FFFFFF
border: 0.5px solid #C8EBE0
border-radius: 14px
padding: 14px
layout: flex, items-center, gap-12px

Estado em progresso:
  border: 0.5px solid #0F6E56
  bg: #EDF7F3

Ícone container: 40px, border-radius 11px
  Default:      bg #F7FBF9, ícone #5D8A7A
  Em progresso: bg #1D9E75, ícone #E1F5EE
  Pendente:     bg #EDF7F3, ícone #0F6E56

Nome: 14px, 500, #0D2B22
Meta: 12px, #3D6B5A, margin-top 2px

Badges de status:
  Em progresso: bg #1D9E75, text #E1F5EE
  Pendente:     bg #EDF7F3, text #085041
  Concluída:    bg #F7FBF9, text #3D6B5A, border 0.5px #C8EBE0
  font: 11px, 500, padding 4px 10px, rounded-full
```

---

### Toast / Snackbar (ação de desfazer — RN-24)
```
position: fixed, bottom 24px, left 50%, transform translateX(-50%)
bg: #0D2B22
text: #E1F5EE, 13px
padding: 12px 16px
border-radius: 12px
layout: flex, items-center, gap-16px
z-index: 50
duração: 5 segundos, some com fade-out

Botão "Desfazer":
  text: #1D9E75, 13px, 500
  sem bg, sem border
```

---

### Modal de confirmação (RN-25)
```
Overlay: bg rgba(4,52,44,0.55), fixed inset-0, z-50

Modal (mobile — bottom sheet):
  bg: #FFFFFF
  border-radius: 24px 24px 0 0
  padding: 0 0 28px
  position: fixed bottom-0 left-0 right-0

  Handle: 36x4px, bg #C8EBE0, rounded, margin 14px auto 18px
  Header: padding 0 20px 16px, border-bottom 0.5px #C8EBE0
    Título: 15px, 500, #085041
    Botão X: ícone 20px #5D8A7A

Modal (desktop — centralizado):
  bg: #FFFFFF
  border-radius: 16px
  padding: 28px
  max-width: 420px
  margin: auto
```

---

### Tela de autenticação

**Mobile:**
```
Layout: flex-col

Bloco superior (hero):
  bg: #085041
  padding: 48px 28px 32px
  Eyebrow: 11px, 500, #5DCAA5, uppercase, letter-spacing 1px
  Título: 28px, 500, #E1F5EE, line-height 1.2
  Subtítulo: 13px, #5DCAA5, margin-top 4px

Sheet inferior (formulário):
  bg: #FFFFFF
  border-radius: 24px 24px 0 0
  padding: 28px 24px 32px
```

**Desktop:**
```
Layout: flex, min-height 100vh

Coluna esquerda (hero):
  width: 360px
  bg: #085041
  padding: 48px 40px
  justify-content: center
  Logo + eyebrow + título + subtítulo

Coluna direita (formulário):
  flex: 1
  bg: #FFFFFF
  display: flex, items-center, justify-center
  padding: 40px
  max-width formulário: 360px
```

---

### Prints de referência por tela

> **Setup:** a pasta `/design` está na raiz do projeto. Anexe o print correspondente em cada sessão do Claude Code.

**Convenção de nomes:** `NN-nome-da-tela-{app|web}.png`
- `-app` → viewport mobile (~390px)
- `-web` → viewport desktop (~1280px)

Telas que existem nas duas plataformas têm dois arquivos com o mesmo número base. Telas que só existem em uma plataforma têm apenas um arquivo.

| # | Tela | App (mobile) | Web (desktop) |
|---|---|---|---|
| 01–02 | Login | `01-login-app.png` | `02-login-web.png` |
| 03–04 | Cadastro | `03-register-app.png` | `04-register-web.png` |
| 05 | Compra ativa — lista | `05-active-purchase-app.png` | ver 08 |
| 06 | Compra ativa — FAB expandido | `06-active-purchase-expanded-buttons-app.png` | — |
| 07 | Compra ativa — carrinho | `07-active-purchase-cart-app.png` | ver 08 |
| 08 | Compra ativa — lista + carrinho | — | `08-active-purchase-web.png` |
| 09 | Criar compra — passo 1 | `09-create-purchase-step1-app.png` | — |
| 10 | Criar compra — passo 2 | `10-create-purchase-step2-app.png` | — |
| 11–12 | Gerenciador de compras | `11-purchases-app.png` | `12-purchases-web.png` |
| 13–14 | Gerenciador de templates | `13-templates-app.png` | `14-templates-web.png` |
| 15 | Dentro de um template | `15-template-detail-app.png` | — |

**Notas de plataforma:**

- **Compra ativa:** no mobile, lista e carrinho são **abas separadas** (`05` e `07`). No web, aparecem **lado a lado em duas colunas** e não há abas (`08`). Ao implementar as HUs de compra ativa, anexar `05`, `07` **e** `08`.
- **FAB expandido** (`06`): estado dos botões "Por template" / "Por texto livre" abertos. No web o mesmo par de botões fica fixo no rodapé (visível em `08`), sem estado colapsado.
- **Modais de criar compra** (`09`, `10`): o print é do bottom sheet mobile. No desktop, o mesmo conteúdo vai num `Dialog` centralizado (ver seção 11.1).
- **Detalhe do template** (`15`): sem print web. Seguir o padrão de layout das outras telas desktop — topbar + header de página + conteúdo.

**Prints a anexar por fase:**

| Fase | Prints |
|---|---|
| 1 — Autenticação | `01`, `02`, `03`, `04` |
| 2 — Estrutura de compras | `09`, `10`, `11`, `12` |
| 3 a 5 — Compra ativa | `05`, `06`, `07`, `08` |
| 6 a 7 — Templates | `13`, `14`, `15` |
| 8 — Integração | `06`, `10` |
