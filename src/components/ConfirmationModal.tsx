// components/ConfirmationModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, email: string, topic: string) => void;
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [interviewTopic, setInterviewTopic] = useState("");

  const handleConfirm = () => {
    if (!userName.trim() || !userEmail.trim() || !interviewTopic.trim()) {
      alert("Please enter your name, email, and interview topic.");
      return;
    }
    onConfirm(userName, userEmail, interviewTopic);
    // Opcional: reseta os campos se necessário
    setUserName("");
    setUserEmail("");
    setInterviewTopic("");
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Enter Your Details</DialogTitle>
      <DialogContent>
        <TextField
          label="Your Name"
          fullWidth
          sx={{ mt: 2 }}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <TextField
          label="Your Email"
          fullWidth
          sx={{ mt: 2 }}
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
        />
        <TextField
          label="Interview Topic"
          fullWidth
          sx={{ mt: 2 }}
          value={interviewTopic}
          onChange={(e) => setInterviewTopic(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Start Interview
        </Button>
      </DialogActions>
    </Dialog>
  );
}
