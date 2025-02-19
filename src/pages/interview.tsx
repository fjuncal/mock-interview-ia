// pages/interview.tsx

declare global {
  interface Window {
    SpeechRecognition: {
      new (): CustomSpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): CustomSpeechRecognition;
    };
  }
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface CustomSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import Layout from "../components/Layout";
import Image from "next/image";

interface Message {
  sender: "ai" | "user";
  text: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Interview() {
  const [userName, setUserName] = useState("Guest");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recognizing, setRecognizing] = useState<boolean>(false);
  const userVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Exemplo: recuperando do localStorage
    const storedName = localStorage.getItem("userName") || "Guest";
    setUserName(storedName);

    // Configura a câmera
    setupCamera();

    // Perguntas fixas
    const simulatedQuestions = [
      `Hi ${storedName}, can you tell me about yourself?`,
      "Why are you interested in this position?",
      "What are your strengths?",
      "What are your weaknesses?",
      "Describe a challenging project you've worked on.",
      "How do you handle tight deadlines?",
      "Where do you see yourself in five years?",
      "How do you work in a team?",
      "What motivates you?",
      "Why should we hire you?",
    ];
    setQuestions(simulatedQuestions);

    // Inicia no index 0
    if (simulatedQuestions.length > 0) {
      runInterview(simulatedQuestions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setupCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.play();
      }
    } catch (error) {
      console.error("Camera error:", error);
    }
  }

  function speakAiText(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  }

  // Inicia o fluxo de perguntas
  async function runInterview(questionsList: string[]) {
    for (let i = 0; i < questionsList.length; i++) {
      await processQuestion(questionsList[i]);
    }
    // Final
    addMessage(
      "ai",
      "Thank you for your responses. The interview is now complete."
    );
    speakAiText("Thank you for your responses. The interview is now complete.");
  }

  // Faz a IA perguntar, espera 1.5s, inicia recognition com time limit 8s
  async function processQuestion(question: string) {
    addMessage("ai", question);
    speakAiText(question);

    // Espera 1.5s antes de iniciar recognition, para evitar ruídos imediatos
    await delay(1500);

    const transcript = await startRecognitionWithTimeout(8000); // 8s
    if (transcript.trim().length < 3) {
      // Se fala for muito curta ou vazia, repetimos a pergunta
      addMessage("ai", "I didn't catch that. Let me ask again...");
      speakAiText("I didn't catch that. Let me ask again...");
      // Repete a mesma pergunta
      await processQuestion(question);
      return;
    } else {
      // Se fala for ok
      addMessage("user", transcript);
      addMessage("ai", `Oh, awesome, ${userName}!`);
      speakAiText(`Oh, awesome, ${userName}!`);
      // Espera 1.5s antes de avançar
      await delay(1500);
    }
  }

  // Reconhecimento com time limit
  async function startRecognitionWithTimeout(
    timeLimitMs: number
  ): Promise<string> {
    return new Promise((resolve) => {
      let finalTranscript = "";
      let ended = false;

      if (
        !("SpeechRecognition" in window) &&
        !("webkitSpeechRecognition" in window)
      ) {
        resolve("");
        return;
      }
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition: CustomSpeechRecognition =
        new SpeechRecognitionConstructor();

      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setRecognizing(true);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        finalTranscript = event.results[0][0].transcript;
      };

      recognition.onerror = () => {
        setRecognizing(false);
      };

      recognition.onend = () => {
        if (!ended) {
          ended = true;
          setRecognizing(false);
          resolve(finalTranscript);
        }
      };

      // Inicia
      recognition.start();

      // Timer
      setTimeout(() => {
        if (!ended) {
          ended = true;
          setRecognizing(false);
          recognition.stop();
          resolve(finalTranscript);
        }
      }, timeLimitMs);
    });
  }

  function addMessage(sender: "ai" | "user", text: string) {
    setMessages((prev) => [...prev, { sender, text }]);
  }

  return (
    <Layout>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Automated Interview
        </Typography>
        <Typography variant="body1" gutterBottom>
          Hello, {userName}. We will now begin your interview automatically.
        </Typography>

        <Stack direction="column" spacing={2}>
          <Stack direction="row" spacing={4}>
            {/* Câmera do Usuário */}
            <Paper
              sx={{
                width: 520,
                height: 400,
                backgroundColor: "#2F394A",
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: "#fff", mb: 1, textAlign: "center" }}
              >
                {userName}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <video
                  ref={userVideoRef}
                  width="100%"
                  autoPlay
                  muted
                  style={{ borderRadius: 8, maxHeight: 350 }}
                />
              </Box>
            </Paper>
            {/* Avatar da IA */}
            <Paper
              sx={{
                width: 520,
                height: 400,
                backgroundColor: "#2F394A",
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: "#fff", mb: 1, textAlign: "center" }}
              >
                Talently AI
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Image
                  src="/images/ai-avatar.png"
                  alt="AI Avatar"
                  width={150}
                  height={150}
                  style={{ borderRadius: "50%" }}
                />
              </Box>
            </Paper>
          </Stack>

          {/* Chat */}
          <Paper
            sx={{
              backgroundColor: "#1F1F1F",
              color: "#fff",
              p: 2,
              overflowY: "auto",
              height: 400,
              mt: 2,
            }}
          >
            <List sx={{ p: 0 }}>
              {messages.map((msg, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    p: 0.5,
                    display: "flex",
                    justifyContent:
                      msg.sender === "ai" ? "flex-start" : "flex-end",
                  }}
                >
                  {msg.sender === "ai" && (
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar
                        src="/images/ai-avatar.png"
                        sx={{ width: 40, height: 40 }}
                      />
                    </ListItemAvatar>
                  )}
                  <Paper
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: msg.sender === "ai" ? "#333" : "#4CAF50",
                      color: "#fff",
                      maxWidth: "70%",
                    }}
                  >
                    <ListItemText
                      primary={msg.text}
                      primaryTypographyProps={{ fontSize: "0.9rem" }}
                    />
                  </Paper>
                </ListItem>
              ))}
            </List>
            {recognizing && (
              <Typography variant="body2" sx={{ color: "red" }}>
                Listening...
              </Typography>
            )}
          </Paper>
        </Stack>
      </Container>
    </Layout>
  );
}
