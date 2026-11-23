# ConectaTI Senac — App Mobile (React Native + Expo)

Cliente mobile do sistema ConectaTI, desenvolvido em **React Native** com o **Expo**.
Consome as mesmas APIs do sistema web (`/api/chamados` e `/api/avaliacoes`).

## Telas

- **Login** — seleção de unidade (Senac DF), usuário e senha (perfil Suporte TI).
- **Chamados** — lista com busca, filtros por status, pull-to-refresh, ações do
  Suporte TI (iniciar atendimento / fechar chamado) e formulário de novo chamado.

## Como executar

```bash
# 1. Rode o servidor web do ConectaTI (raiz do projeto)
bun run dev   # ou: npm run dev

# 2. Em outro terminal, entre na pasta mobile e instale as dependências
cd mobile
npm install

# 3. Aponte para o IP do seu computador (necessário para celular físico)
#    Edite mobile/src/api.ts:
#      export const API_URL = "http://SEU_IP_LOCAL:3000";

# 4. Inicie o Expo
npx expo start
```

Escaneie o QR Code exibido com o app **Expo Go** (Android/iOS) ou pressione
`a` para emulador Android / `i` para simulador iOS.

## Estrutura

```
mobile/
├── App.tsx                    # raiz: alterna Login ⇄ Chamados
├── app.json                   # configuração Expo (pacote br.senac.conectati)
└── src/
    ├── api.ts                 # tipos + acesso à API (API_URL configurável)
    └── screens/
        ├── LoginScreen.tsx    # unidade + usuário + senha
        └── ChamadosScreen.tsx # lista, filtros, novo chamado, ações do suporte
```
