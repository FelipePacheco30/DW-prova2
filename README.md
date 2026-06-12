# Lhama Mia

Aplicacao fullstack para gerenciamento de reservas de mesas em restaurante, desenvolvida como projeto pratico de Desenvolvimento Web III.

O sistema foi pensado para simular um fluxo proximo de uma operacao real: cadastrar reservas, visualizar a ocupacao do salao, impedir conflitos de horario, respeitar capacidade das mesas e manter os status atualizados conforme o tempo.

# Desenvolvedores

Carlos Eduardo Gonçalves do Espírito Santo

Felipe Ferreira Pacheco

## Objetivo do projeto

O objetivo principal e oferecer uma experiencia completa de reservas com:

- frontend em React + TypeScript
- backend em Express + TypeScript
- persistencia em MongoDB com Mongoose
- regras de negocio aplicadas no servidor
- mapa visual interativo das mesas
- interface com foco em uso real, e nao apenas demonstracao tecnica

## Tecnologias utilizadas

- React 19
- TypeScript
- Vite
- Express
- Mongoose
- MongoDB
- Lucide React
- Concurrently
- TSX

## Arquitetura geral

O projeto foi organizado em duas partes principais:

- `frontend/`: interface React, estilos, chamadas para API e fluxo de interacao do usuario
- `backend/`: servidor Express, regras de negocio, modelos do MongoDB e rotas REST

A comunicacao entre frontend e backend acontece via HTTP usando a API `/api`.

## Estrutura de pastas

```text
.
|-- backend/
|   |-- db.ts
|   |-- index.ts
|   |-- types.ts
|   |-- models/
|   |   |-- Reservation.ts
|   |   `-- Table.ts
|   |-- routes/
|   |   |-- reservations.ts
|   |   `-- tables.ts
|   `-- services/
|       `-- reservations.ts
|-- frontend/
|   |-- index.html
|   `-- src/
|       |-- api.ts
|       |-- App.tsx
|       |-- main.tsx
|       |-- styles.css
|       `-- types.ts
|-- dist/
|-- package.json
|-- tsconfig.json
|-- tsconfig.server.json
|-- vite.config.ts
`-- README.md
```

## Papel de cada parte

### Frontend

Arquivos principais:

- [frontend/src/App.tsx](c:/DW-p2/frontend/src/App.tsx): fluxo principal da interface, mapa das mesas, modal de reserva/edicao, filtros e KPIs
- [frontend/src/api.ts](c:/DW-p2/frontend/src/api.ts): camada de comunicacao com a API
- [frontend/src/styles.css](c:/DW-p2/frontend/src/styles.css): identidade visual e responsividade
- [frontend/src/types.ts](c:/DW-p2/frontend/src/types.ts): tipos usados no cliente

Responsabilidades:

- listar mesas e reservas
- abrir modal de criacao ao clicar na mesa
- abrir modal de edicao ao clicar em editar reserva
- disparar filtros em tempo real
- exibir toasts de sucesso e erro
- refletir visualmente o status de cada mesa

### Backend

Arquivos principais:

- [backend/index.ts](c:/DW-p2/backend/index.ts): inicializacao do servidor Express e registro das rotas
- [backend/db.ts](c:/DW-p2/backend/db.ts): conexao com MongoDB e seed inicial das mesas
- [backend/routes/reservations.ts](c:/DW-p2/backend/routes/reservations.ts): CRUD de reservas
- [backend/routes/tables.ts](c:/DW-p2/backend/routes/tables.ts): retorno do mapa de mesas com status e reserva atual
- [backend/services/reservations.ts](c:/DW-p2/backend/services/reservations.ts): regras de negocio e calculo de status

Responsabilidades:

- validar as regras obrigatorias da prova
- calcular status temporal da reserva
- impedir conflito de mesa no mesmo intervalo
- validar capacidade da mesa
- manter persistencia em MongoDB
- devolver mensagens claras para o frontend

## Como rodar o projeto

### Requisitos

- Node.js 20 ou superior
- MongoDB local ou MongoDB Atlas

### Instalacao

```bash
npm install
```

### Variaveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/reserva
PORT=3001
```

Descricao:

- `MONGODB_URI`: string de conexao com o banco MongoDB
- `PORT`: porta do backend

### Rodando em desenvolvimento

```bash
npm run dev
```

Portas:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`

### Rodando buildado

```bash
npm run build
npm start
```

Portas:

- frontend preview: `http://localhost:3000`
- backend API: `http://localhost:3001`

## Scripts disponiveis

- `npm run dev`: sobe frontend e backend em paralelo
- `npm run dev:client`: sobe apenas o frontend com Vite
- `npm run dev:server`: sobe apenas o backend com recarga via TSX
- `npm run build`: compila backend e gera build do frontend
- `npm run start`: sobe backend compilado e preview do frontend
- `npm run typecheck`: roda verificacao de tipos no frontend e backend

## Modelagem do banco de dados

O banco foi modelado com duas colecoes principais.

### Colecao `tables`

Modelada em [backend/models/Table.ts](c:/DW-p2/backend/models/Table.ts)

Campos:

- `numero`: numero unico da mesa
- `capacidade`: quantidade maxima de pessoas suportada
- `localizacao`: descricao da area da mesa no restaurante
- `createdAt` e `updatedAt`: timestamps automaticos do Mongoose

Exemplo:

```json
{
  "numero": 3,
  "capacidade": 4,
  "localizacao": "Salao principal"
}
```

### Colecao `reservations`

Modelada em [backend/models/Reservation.ts](c:/DW-p2/backend/models/Reservation.ts)

Campos:

- `clienteNome`: nome do cliente
- `contato`: telefone do cliente
- `numeroMesa`: mesa reservada
- `quantidadePessoas`: total de pessoas da reserva
- `dataHora`: data e hora de inicio
- `duracaoMin`: duracao da reserva em minutos
- `observacoes`: texto livre opcional
- `status`: `reservado`, `ocupado`, `finalizado` ou `cancelado`
- `createdAt` e `updatedAt`: timestamps automaticos

Indice:

- indice em `numeroMesa + dataHora` para acelerar a consulta de conflito

Exemplo:

```json
{
  "clienteNome": "Maria Souza",
  "contato": "11 2345-6789",
  "numeroMesa": 5,
  "quantidadePessoas": 4,
  "dataHora": "2026-06-12T22:00:00.000Z",
  "duracaoMin": 90,
  "observacoes": "Aniversario",
  "status": "reservado"
}
```

## Seed inicial das mesas

Ao conectar no banco, o sistema verifica se a colecao de mesas esta vazia. Se estiver, cadastra automaticamente um conjunto inicial em [backend/db.ts](c:/DW-p2/backend/db.ts).

Mesas iniciais:

- Mesa 1: 2 lugares, `Janela`
- Mesa 2: 2 lugares, `Varanda`
- Mesa 3: 4 lugares, `Salao principal`
- Mesa 4: 4 lugares, `Salao principal`
- Mesa 5: 6 lugares, `Area interna`
- Mesa 6: 6 lugares, `Varanda`
- Mesa 7: 8 lugares, `Espaco familia`
- Mesa 8: 10 lugares, `Espaco reservado`

## Regras de negocio implementadas

As regras ficam centralizadas principalmente em [backend/services/reservations.ts](c:/DW-p2/backend/services/reservations.ts).

Regras atendidas:

- nao permitir duas reservas para a mesma mesa no mesmo intervalo
- validar se a mesa comporta a quantidade de pessoas
- exigir antecedencia minima de 1 hora
- usar duracao padrao de 90 minutos quando nao informada
- atualizar o status da reserva com base no horario atual
- permitir cancelamento logico da reserva
- permitir remocao fisica se a reserva ja estiver cancelada

## Logica de status da reserva

O status e calculado da seguinte forma:

- `reservado`: o horario ainda nao chegou
- `ocupado`: a reserva esta em andamento
- `finalizado`: o horario ja terminou
- `cancelado`: a reserva foi cancelada manualmente

No endpoint de mesas, o backend escolhe a reserva mais relevante por mesa para desenhar o mapa:

- se houver uma reserva em andamento, a mesa aparece como `ocupada`
- se nao houver reserva em andamento, mas houver uma futura, ela aparece como `reservada`
- caso contrario, a mesa aparece como `disponivel`

## Endpoints principais

### Health check

- `GET /api/health`

Resposta:

```json
{
  "message": "API Lhama Mia online."
}
```

### Mesas

- `GET /api/mesas`

Retorna a lista de mesas com:

- numero
- capacidade
- localizacao
- status atual da mesa
- reserva atual, quando existir

### Reservas

- `GET /api/reservas`

Filtros suportados via query string:

- `cliente`
- `mesa`
- `data`
- `status`

- `POST /api/reservas`

Cria uma nova reserva.

- `PUT /api/reservas/:id`

Atualiza uma reserva existente.

- `DELETE /api/reservas/:id`

Comportamento:

- se a reserva estiver ativa, faz cancelamento logico
- se a reserva ja estiver cancelada, remove definitivamente do banco

## Experiencia do usuario

O frontend foi desenhado para funcionar como painel de operacao visual:

- mapa interativo do salao
- clique na mesa para abrir o modal de nova reserva
- edicao de reserva em modal
- filtro por cliente em tempo real
- toasts de sucesso e erro
- KPIs atualizados com base nos dados do banco
- cores diferentes para mesa livre, reservada e ocupada
- icones de pessoas para indicar ocupacao relativa da mesa

## Validacoes do frontend

Mesmo com as regras sendo garantidas no backend, o frontend antecipa alguns erros para melhorar a usabilidade:

- mascara de telefone no formato `XX XXXX-XXXX`
- limite de pessoas de acordo com a capacidade da mesa
- filtro de mesa limitado ao intervalo de mesas existentes
- possibilidade de limpar busca de cliente rapidamente

## Relacao com o enunciado

O projeto cobre os pontos principais do PDF:

- CRUD completo de reservas
- MongoDB como persistencia
- Express com TypeScript no backend
- React com TypeScript no frontend
- mensagens claras nas operacoes
- validacoes de negocio obrigatorias
- mapa visual das mesas com cores por status

Observacao:

- o enunciado mencionava `localhost:3000` como porta unica, mas nesta versao o frontend foi ajustado para rodar em `3000` e o backend em `3001`, conforme requisito posterior definido no desenvolvimento

## Validacao realizada

Comandos executados no projeto:

```bash
npm run typecheck
npm run build
```

Ambos passaram com sucesso na versao atual.
