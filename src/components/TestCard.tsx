// components/TestCard.tsx
import React, { ReactNode } from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";

interface TestCardProps {
  title: string;
  buttonLabel: string;
  onTest: () => void;
  children?: ReactNode;
}

const TestCard: React.FC<TestCardProps> = ({
  title,
  buttonLabel,
  onTest,
  children,
}) => {
  return (
    <Card
      sx={{
        p: 2,
        textAlign: "center",
        backgroundColor: "background.paper",
        boxShadow: 3,
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: "text.primary" }}>
          {title}
        </Typography>
        <Button
          variant="contained"
          onClick={onTest}
          sx={{
            mt: 1,
            backgroundColor: "#3813c0", // Cor personalizada para o botão
            color: "#fff",
            "&:hover": {
              backgroundColor: "#512dd3",
            },
          }}
        >
          {buttonLabel}
        </Button>
        {children && <Box sx={{ mt: 2 }}>{children}</Box>}
      </CardContent>
    </Card>
  );
};

export default TestCard;
