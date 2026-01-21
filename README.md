# Q-Feed (JavaScript Version)

This project is a migration of the "Q-Feed Interview Prep App" from TypeScript to JavaScript.

## Setup & Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
    (Note: If you encounter peer dependency issues with React versions, use `--legacy-peer-deps` or ensure `react` and `react-dom` are compatible with `react-popper` etc.)

2.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## Project Structure

-   `src/app/pages`: Contains all page components (converted to `.jsx`).
-   `src/app/components`: Reusable components (e.g., `AppHeader`, `BottomNav`).
-   `src/app/components/ui`: ShadCN UI components (converted to `.jsx`).
-   `src/data`: Static data (e.g., `questions.js`).
-   `src/utils`: Utility functions (`storage.js`).
-   `src/styles`: CSS files (Tailwind, Theme).

## Migration Notes

-   All `.tsx` files have been converted to `.jsx`.
-   TypeScript interfaces and types have been removed.
-   `tsconfig.json` is no longer needed (replaced/ignored in favor of `jsconfig.json` if applicable, or just standard Vite JS setup).
-   `vite.config.js` is configured for React and Tailwind CSS.
-   Data files (e.g. `questions.ts`) were converted to `questions.js` or `.json`.
