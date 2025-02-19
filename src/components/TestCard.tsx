// components/TestCard.tsx
import React, { ReactNode } from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface TestCardProps {
  title: string;
  buttonLabel: string;
  onTest: () => void;
  children?: ReactNode;
  tested?: boolean;
}

const TestCard: React.FC<TestCardProps> = ({
  title,
  buttonLabel,
  onTest,
  children,
  tested,
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
            backgroundColor: "#3813c0",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#512dd3",
            },
          }}
        >
          {buttonLabel}
        </Button>
        {tested && (
          <Box sx={{ mt: 1 }}>
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 32 }} />
          </Box>
        )}
        {children && <Box sx={{ mt: 2 }}>{children}</Box>}
      </CardContent>
    </Card>
  );
};

export default TestCard;
