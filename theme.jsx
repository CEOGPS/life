import { ThemeProvider as NextThemeProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}