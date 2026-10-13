/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores de Fundo e Estrutura
        coral: "#001429",    // Faixa / Painel da Esquerda (Azul Petróleo Profundo)[cite: 4, 6]
        sky: "#001F3D",      // Títulos e Headers (Azul Marinho Fechado)[cite: 4, 6]
        
        // Cores de Elementos de Ação (Botões e Links)
        mint: "#00A8FF",     // Fundo do Botão (Azul Royal Vibrante)[cite: 4, 6]
        mintHover: "#4B5CFF",// Cor do botão ao passar o mouse

        // Cores de Texto
        ink: "#0F172A",      // Apenas para Textos Principais (Grafite Escuro)
        
        // Auxiliares
        kinetixBg: "#b3ebf2", // Fundo suave do lado direito
        kinetixBorder: "#E2E8F0", // Borda suave dos campos de entrada

        darkTheme: {
          // Cores de Fundo e Estrutura
          bg: "#020617",       // Fundo principal
          panel: "#0F172A",    // Cards, headers e paineis
          surface: "#0F172A",  // Campos e blocos internos

          // Cores de Elementos de Acao (Botoes e Links)
          action: "#38BDF8",      // Acoes principais e links
          actionHover: "#818CF8", // Hover de acoes

          // Cores de Texto
          text: "#E2E8F0",  // Texto principal
          muted: "#ADD8E6", // Texto secundario

          // Auxiliares
          border: "#1E293B", // Bordas
          danger: "#7F1D1D"  // Fundo de hover/alertas de perigo
        }
      }
    }
  },
  plugins: []
};
