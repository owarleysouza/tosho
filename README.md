# ToSho

## Definição do(s) Problema(s)

1. Ao fazer minhas compras no supermercado, não lembro dos produtos e as quantidades que preciso comprar
2. Ao fazer minhas compras, não consigo saber exatamente o que já peguei e o que ainda falta
3. Ao realizar minhas compras, não sei quanto gastei a cada mês nessas compras

## Definição de Solução

- Uma ferramenta que permite ao usuário realizar suas compras de forma simples, e monitorar o preço das compras ao longo do tempo

## Jornada de Usuário

- [Protótipo do tosho](https://www.figma.com/proto/jAMv5sbiyilhpSaUTgYhQ1/Tosho?node-id=56-5775&starting-point-node-id=56%3A5775&mode=design&t=dSEL5dpraiC6kbRI-1)

## Processo realizado

1. Definição dos problemas
2. Definição da solução
3. Criação de backlog e regras de negócio
4. Análise de ferramentas existentes
   - Buy me a pie!
   - Bring!
   - SoftList
   - Listonic
5. Criação do protótipo
6. Definição da stack

## Stack Utilizada

1. React
2. Javascript
3. Vite
4. NPM
5. React Router
6. Redux
7. Tailwind
8. Shadcn
9. Vercel
10. Date-fns
11. React Hook Form

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
