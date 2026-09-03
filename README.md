# Wall-et — Controle Financeiro Pessoal para Desktop

Aplicativo desktop minimalista e elegante de finanças pessoais, projetado seguindo as diretrizes do **Apple Human Interface Guidelines (HIG)** para macOS e Windows.

Desenvolvido com **Tauri v2**, **React 19**, **TypeScript** e **Tailwind CSS**.

---

## ✨ Recursos

- **⚡ Lançamento Rápido**: Inserção ágil de ganhos, gastos ou faturas em poucos cliques.
- **📅 Calendário Financeiro Interativo**: Visualização mensal com dias coloridos por vencimentos e recebimentos programados.
- **🏷️ Categorização de Despesas**: Chips rápidos para grupos como Alimentação, Moradia, Transporte, Lazer e Saúde.
- **🏦 Controle de Múltiplas Contas**: Centralização de contas correntes, carteiras digitais, dinheiro vivo e cartões com ajuste de saldo.
- **🔔 Alertas de Vencimento**: Notificações e badges visuais para contas atrasadas ou vencendo nos próximos dias.
- **📊 Relatórios Visuais**: Análise de "Para onde vai o dinheiro", gráfico de evolução do saldo devedor e composição do comprometimento mensal.
- **🔒 100% Offline & Seguro**: Seus dados financeiros são salvos localmente na máquina, com total privacidade e sem dependência de serviços em nuvem.

---

## 🚀 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18+)
- [Rust](https://rustup.rs/) (para compilar o executável desktop nativo)

### Modo de Desenvolvimento
```bash
npm install
npm run tauri dev
```
*(ou apenas `npm run dev` para rodar na web em `http://localhost:1420`)*

### Gerar Executável (`.exe`)
```bash
npm run tauri build
```
O instalador será gerado na pasta `src-tauri/target/release/bundle/nsis/`.
