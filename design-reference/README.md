# Task Board design reference

These files are the reusable visual foundation from the Task Board project.

## Reuse in a new React/Tailwind project

1. Copy `styles.css` into the new project's global stylesheet.
2. Copy `components.json` if the project uses shadcn/ui.
3. Copy `button.tsx` and `theme-toggle.tsx` into the component library.
4. Install the matching dependencies: Tailwind CSS, `lucide-react`, `class-variance-authority`, `@radix-ui/react-slot`, and `tailwind-merge`.
5. Keep the design tokens, fonts, light/dark colors, border radius, compact spacing, and responsive behavior as the visual baseline.

Do not copy task-board data, routes, or Supabase logic when using these files in another product.
