// components/Layout.tsx
import React, { ReactNode } from "react";
import { AppBar, Toolbar, Typography, Container, Box } from "@mui/material";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Sobrescrevendo o AppBar para não usar a cor primária do tema */}
      <AppBar
        position="static"
        elevation={4}
        sx={{ backgroundColor: "#2F394A" }}
      >
        <Toolbar>
          <Typography variant="h6" component="div">
            Interview with AI
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>{children}</Container>
      <Box
        sx={{
          mt: 4,
          py: 2,
          backgroundColor: "secondary.main",
          textAlign: "center",
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} Interview with AI. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
