# Wall-et

Aplicativo desktop para gestao financeira pessoal e controle de fluxo de caixa, desenvolvido com Tauri v2 e React. Opera de forma totalmente offline, armazenando os dados localmente no dispositivo.

## Stack Tecnologica

- **Core Desktop**: Tauri v2 (Rust)
- **Frontend**: React 19, TypeScript
- **Estilizacao**: Tailwind CSS v4, CSS Tokens
- **Animacoes e Motion**: Framer Motion, Lottie-web
- **Graficos**: Recharts
- **Empacotamento**: NSIS (Instalador Windows .exe) e WiX (.msi)
- **Auto-Updater**: `@tauri-apps/plugin-updater` com assinatura digital Minisign

## Arquitetura do Projeto

```
wall-et/
├── src/
│   ├── assets/              # Recursos visuais e icones
│   ├── components/          # Componentes de interface (Tabs, Modais, Paineis)
│   ├── context/             # Gerenciamento de estado (LedgerContext)
│   ├── lib/                 # Algoritmos financeiros e cliente de atualizacao
│   └── types/               # Tipagens estaticas TypeScript
├── src-tauri/
│   ├── src/                 # Inicializacao nativa Rust e registro de plugins
│   ├── icons/               # Icones do aplicativo para distribuicao desktop
│   ├── Cargo.toml           # Dependencias nativas do ecossistema Rust
│   └── tauri.conf.json      # Configuracoes do runtime Tauri, NSIS e updater
├── public/                  # Arquivos publicos e assets Lottie
└── .github/workflows/       # Workflow de CI/CD para compilacao e release
```

## Modulos e Recursos

- **Fluxo de Caixa e Balanco**: Calculo em tempo real de saldo disponivel, receitas a receber, compromissos fixos e saldo devedor liquido ponderado por rendas.
- **Parcelamentos com Competencia Temporal**: Cronograma de parcelas com distribuicao de datas nos meses corretos, sem onerar o mes corrente caso a data de inicio seja futura, com suporte a reversao de pagamentos e estorno em conta vinculada.
- **Gestao de Contas e Carteiras**: Suporte a multiplas fontes de recursos (conta corrente, carteira, cartao de credito, poupanca, investimento) com liquidacao automatica de lancamentos.
- **Agenda Financeira**: Calendario interativo com mapeamento diario de receitas, faturas e parcelas programadas, identificando prazos e contas em atraso.
- **Persistencia Local**: Operacao 100% offline via localStorage, sem coleta de telemetria externa ou dependencia de servidores centrais.
- **Atualizacao Automatica In-App**: Inspecao em segundo plano de novas versoes publicadas no GitHub Releases, com download de delta assinado criptograficamente e reinicializacao controlada.

## Execucao e Desenvolvimento

### Pre-requisitos

- Node.js 20 LTS ou superior
- Rust stable e Cargo
- Visual Studio C++ Build Tools (ambiente Windows)

### Instalacao

```bash
npm install
```

### Execucao em Desenvolvimento

Para iniciar o runtime desktop completo (Tauri + Vite):
```bash
npm run tauri dev
```

Para executar apenas a interface web no navegador (`http://localhost:1420`):
```bash
npm run dev
```

### Compilacao de Producao

Para compilar e gerar o instalador do Windows:
```bash
npm run tauri build
```

O instalador NSIS sera gerado no diretorio:
`src-tauri/target/release/bundle/nsis/`

## Publicacao de Releases (CI/CD)

O pipeline de integracao e entrega continua esta implementado em `.github/workflows/release.yml`.

### Disparo por Tag

```bash
git tag v0.1.X
git push origin v0.1.X
```

### Disparo Manual

Acesse a aba **Actions** no repositorio do GitHub, selecione o workflow **Release Executable & Auto-Updater** e execute via `workflow_dispatch` informando a tag desejada.

O fluxo compila os instaladores, assina os binarios com `TAURI_SIGNING_PRIVATE_KEY` e gera o manifesto `latest.json` compativel com o plugin de auto-atualizacao desktop.
