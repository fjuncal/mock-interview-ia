import Layout from "@/components/Layout";
import { Typography, Button, Box, Paper } from "@mui/material";

export default function Home() {
  return (
    <>
      <Layout>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ color: "text.primary" }}
          >
            Welcome to Interview with AI
          </Typography>
          <Typography
            variant="body1"
            gutterBottom
            sx={{ color: "text.secondary" }}
          >
            You will go through an automated interview experience. We will first
            validate your environment.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" color="primary" size="large">
              Start Interview
            </Button>
          </Box>
        </Paper>
      </Layout>
    </>
  );
}
