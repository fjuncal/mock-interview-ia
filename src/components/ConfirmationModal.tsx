// components/ConfirmationModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
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

  const [errors, setErrors] = useState({
    userName: false,
    userEmail: false,
    interviewTopic: false,
  });

  const handleConfirm = () => {
    const newErrors = {
      userName: userName.trim() === "",
      userEmail: userEmail.trim() === "",
      interviewTopic: interviewTopic.trim() === "",
    };

    setErrors(newErrors);

    if (newErrors.userName || newErrors.userEmail || newErrors.interviewTopic) {
      return; // Não confirma se houver erro
    }

    onConfirm(userName, userEmail, interviewTopic);
    // Opcional: reseta os campos
    setUserName("");
    setUserEmail("");
    setInterviewTopic("");
    setErrors({ userName: false, userEmail: false, interviewTopic: false });
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
          error={errors.userName}
          helperText={errors.userName ? "Name is required" : ""}
        />
        <TextField
          label="Your Email"
          fullWidth
          sx={{ mt: 2 }}
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          error={errors.userEmail}
          helperText={errors.userEmail ? "Email is required" : ""}
        />
        <FormControl fullWidth sx={{ mt: 2 }} error={errors.interviewTopic}>
          <InputLabel id="topic-select-label">Interview Topic</InputLabel>
          <Select
            labelId="topic-select-label"
            value={interviewTopic}
            label="Interview Topic"
            onChange={(e) => setInterviewTopic(e.target.value as string)}
          >
            <MenuItem value={"initialScreening"}>Initial Screening</MenuItem>
            <MenuItem value={"java"}>Java</MenuItem>
            <MenuItem value={"springboot"}>Spring Boot</MenuItem>
            <MenuItem value={"golang"}>Golang</MenuItem>
          </Select>
          {errors.interviewTopic && (
            <FormHelperText>Interview Topic is required</FormHelperText>
          )}
        </FormControl>
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
