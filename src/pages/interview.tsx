// pages/interview.tsx

// Declarações globais para SpeechRecognition
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

// Tipos para SpeechRecognition e seus eventos
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
  // Estados dos dados do usuário
  const [userName, setUserName] = useState<string>("Guest");
  const [userEmail, setUserEmail] = useState<string>("no-email@domain.com");
  const [interviewTopic, setInterviewTopic] = useState<string>("General");

  // Estados para perguntas e histórico do chat
  const [questions, setQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recognizing, setRecognizing] = useState<boolean>(false);

  // Referência para a câmera do usuário
  const userVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Recupera dados do localStorage
    const storedName = localStorage.getItem("userName") || "Guest";
    const storedEmail =
      localStorage.getItem("userEmail") || "no-email@domain.com";
    const storedTopic = localStorage.getItem("interviewTopic") || "General";
    setUserName(storedName);
    setUserEmail(storedEmail);
    setInterviewTopic(storedTopic);

    setupCamera();

    // Define perguntas simuladas – você pode substituir por um conjunto estático específico para cada tema
    const simulatedQuestions = [
      "Can you tell me about yourself?",
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

    // Inicia o fluxo de entrevista
    runInterview(simulatedQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Configura a câmera do usuário */
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
      console.error("Error accessing camera/mic:", error);
    }
  }

  /** Faz a IA falar via TTS */
  function speakAiText(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  }

  /**
   * Inicia o reconhecimento de voz e retorna uma Promise que resolve com o transcript final.
   */
  function startRecognitionAsync(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (
        !("SpeechRecognition" in window) &&
        !("webkitSpeechRecognition" in window)
      ) {
        reject("Speech recognition not supported.");
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

      let finalTranscript = "";
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        finalTranscript = event.results[0][0].transcript;
        console.log("onresult:", finalTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setRecognizing(false);
        reject(event.error);
      };

      recognition.onend = () => {
        setRecognizing(false);
        console.log("onend, transcript:", finalTranscript);
        resolve(finalTranscript);
      };

      recognition.start();
    });
  }

  /**
   * Processa uma única pergunta:
   * - Insere a pergunta no chat e a fala
   * - Aguarda o transcript do usuário
   * - Insere a resposta do usuário e aguarda um delay para avançar
   */
  async function askQuestionAsync(question: string): Promise<void> {
    setMessages((prev) => [...prev, { sender: "ai", text: question }]);
    speakAiText(question);
    try {
      const transcript = await startRecognitionAsync();
      if (transcript.trim() === "") {
        setMessages((prev) => [
          ...prev,
          { sender: "user", text: "(No response)" },
        ]);
      } else {
        setMessages((prev) => [...prev, { sender: "user", text: transcript }]);
      }
    } catch (error) {
      console.error("Recognition error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: "(Recognition error)" },
      ]);
    }
    await delay(1500);
  }

  /** Itera sobre as perguntas de forma sequencial */
  async function runInterview(questionsList: string[]) {
    for (let i = 0; i < questionsList.length; i++) {
      await askQuestionAsync(questionsList[i]);
    }
    const endMsg: Message = {
      sender: "ai",
      text: "Thank you for your responses. The interview is now complete.",
    };
    setMessages((prev) => [...prev, endMsg]);
    speakAiText(endMsg.text);
  }

  return (
    <Layout>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Interview Session
        </Typography>
        <Typography variant="body1" gutterBottom>
          Name: {userName} | Email: {userEmail} | Topic: {interviewTopic}
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {/* Área das Câmeras */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", gap: 4 }}>
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
            </Box>
          </Box>

          {/* Painel de Chat/Transcripts */}
          <Box
            sx={{
              width: 360,
              backgroundColor: "#2F394A",
              p: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
              Conversation
            </Typography>
            <Paper
              sx={{
                flex: 1,
                backgroundColor: "#1F1F1F",
                color: "#fff",
                p: 2,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1,
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
                    {msg.sender === "ai" ? (
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar
                          src="/images/ai-avatar.png"
                          sx={{ width: 40, height: 40 }}
                        />
                      </ListItemAvatar>
                    ) : null}
                    <Paper
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        backgroundColor:
                          msg.sender === "ai" ? "#333" : "#4CAF50",
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
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Layout>
  );
}
