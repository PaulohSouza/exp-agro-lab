// ESLint flat config — padrão de desenvolvimento EXP-AGROLAB.
// Ver SDD/03-arquitetura/04-padroes-desenvolvimento.md (§3, §9).
// As regras de nomenclatura entram como "warn" para adoção incremental (D5):
// código novo nasce no padrão; o legado é migrado ao tocar cada área.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    // Só lintamos o nosso código (apps/api, apps/web, packages/*).
    // apps/mobile está fora do workspace pnpm (toolchain própria) e as pastas
    // de material de referência não são código do projeto.
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/build/**",
      "**/*.min.js",
      "apps/mobile/**",
      "apps/api/prisma/migrations/**",
      "**/*.config.{js,mjs,cjs,ts}",
      // Material de referência / não-código (fora do monorepo):
      "base-projeto/**",
      "BD/**",
      "docs/**",
      "estrutura claude/**",
      "prints-projeto-exemplo/**",
      "projeto pesquisa comercial/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // ---- Nomenclatura (§3/§4). warn = checklist de adoção, não bloqueia. ----
      "@typescript-eslint/naming-convention": [
        "warn",
        // Tipos, classes, interfaces, enums (o TIPO) → PascalCase.
        { selector: "typeLike", format: ["PascalCase"] },
        // Valores de enum → UPPER_SNAKE_CASE (D3).
        { selector: "enumMember", format: ["UPPER_CASE"] },
        // Variáveis: camelCase; const de módulo UPPER_CASE; componentes/factories PascalCase.
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
        // Métodos/propriedades de classe em camelCase (termos de domínio em PT são camelCase).
        {
          selector: "memberLike",
          modifiers: ["private"],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        // Propriedades de objeto/tipo: livre (chaves de DTO, JSON externo, i18n PT, etc.).
        { selector: "objectLiteralProperty", format: null },
        { selector: "typeProperty", format: null },
        { selector: "import", format: null },
      ],

      // ---- Ruído alto no legado: warn por ora, apertar depois. ----
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Constantes portadas do SAGRE (mais dígitos que o double) e dead-code
      // menor: visível, mas não bloqueia. Limpar de forma incremental.
      "no-loss-of-precision": "warn",
      "no-useless-assignment": "warn",
    },
  },
  // Web (Next/React): habilita as regras de hooks (resolve os eslint-disable
  // existentes) e os globais de browser.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Testes podem usar nomes/qualquer estilo com mais folga.
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Desliga regras de estilo que conflitam com o Prettier (deve ser o último).
  prettier,
);
