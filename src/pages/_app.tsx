import type { AppProps } from "next/app";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: {
      main: "#181C28",
    },
    secondary: {
      main: "#2F394A",
    },
    background: {
      default: "#181C28",
      paper: "#2F394A",
    },
    text: {
      primary: "#F5F5F5",
      secondary: "#B0B0B0",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});
export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
