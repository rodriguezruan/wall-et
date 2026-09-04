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


## Modulos e Recursos

- **Fluxo de Caixa e Balanco**: Calculo em tempo real de saldo disponivel, receitas a receber, compromissos fixos e saldo devedor liquido ponderado por rendas.
- **Parcelamentos com Competencia Temporal**: Cronograma de parcelas com distribuicao de datas nos meses corretos, sem onerar o mes corrente caso a data de inicio seja futura, com suporte a reversao de pagamentos e estorno em conta vinculada.
- **Gestao de Contas e Carteiras**: Suporte a multiplas fontes de recursos (conta corrente, carteira, cartao de credito, poupanca, investimento) com liquidacao automatica de lancamentos.
- **Agenda Financeira**: Calendario interativo com mapeamento diario de receitas, faturas e parcelas programadas, identificando prazos e contas em atraso.
- **Persistencia Local**: Operacao 100% offline via localStorage, sem coleta de telemetria externa ou dependencia de servidores centrais.
- **Atualizacao Automatica In-App**: Inspecao em segundo plano de novas versoes publicadas no GitHub Releases, com download de delta assinado criptograficamente e reinicializacao controlada.
