// pages/interview.tsx

declare global {
  interface Window {
    SpeechRecognition: { new (): CustomSpeechRecognition };
    webkitSpeechRecognition: { new (): CustomSpeechRecognition };
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
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import Layout from "../components/Layout";
import Image from "next/image";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface Message {
  sender: "ai" | "user";
  text: string;
}

export default function Interview() {
  // --------------------------------------------------
  // ESTADOS DO USUÁRIO E ENTREVISTA
  // --------------------------------------------------
  const [userName, setUserName] = useState<string>("Guest");
  const [userEmail, setUserEmail] = useState<string>("no-email@domain.com");
  const [interviewTopic, setInterviewTopic] = useState<string>("General");

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);

  // --------------------------------------------------
  // ESTADOS DE GRAVAÇÃO E RECONHECIMENTO
  // --------------------------------------------------
  const [recording, setRecording] = useState<boolean>(false); // se o toggle está ligado
  const [recognizing, setRecognizing] = useState<boolean>(false); // se a API está em processo
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  // Se quisermos um label textual acima do botão:
  const [recordLabel, setRecordLabel] = useState<string>("Start Recording");
  const [nextLabel, setNextLabel] = useState<string>("Next Question");

  // --------------------------------------------------
  // REFERÊNCIAS
  // --------------------------------------------------
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);

  // --------------------------------------------------
  // EFEITO INICIAL
  // --------------------------------------------------
  useEffect(() => {
    // Carrega dados do localStorage
    const storedName = localStorage.getItem("userName") || "Guest";
    const storedEmail =
      localStorage.getItem("userEmail") || "no-email@domain.com";
    const storedTopic = localStorage.getItem("interviewTopic") || "General";

    setUserName(storedName);
    setUserEmail(storedEmail);
    setInterviewTopic(storedTopic);

    setupCamera();

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

    // Exibe a primeira pergunta apenas uma vez
    if (simulatedQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      addAiMessage(simulatedQuestions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // FUNÇÃO PARA CONFIGURAR A CÂMERA
  // --------------------------------------------------
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

  // --------------------------------------------------
  // FUNÇÕES DE MENSAGENS E SÍNTESE
  // --------------------------------------------------
  function speakAiText(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  }

  function addMessage(sender: "ai" | "user", text: string) {
    setMessages((prev) => [...prev, { sender, text }]);
  }

  function addAiMessage(text: string) {
    addMessage("ai", text);
    speakAiText(text);
  }

  // --------------------------------------------------
  // FUNÇÃO PARA INICIAR RECONHECIMENTO
  // --------------------------------------------------
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
      let finished = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        finalTranscript = event.results[0][0].transcript;
        console.log("onresult:", finalTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        finished = true;
        setRecognizing(false);
        reject(event.error);
      };

      recognition.onend = () => {
        if (!finished) {
          finished = true;
          setRecognizing(false);
          console.log("onend, transcript:", finalTranscript);
          resolve(finalTranscript);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;

      // Força stop após 15s
      setTimeout(() => {
        if (!finished) {
          finished = true;
          setRecognizing(false);
          recognition.stop();
          console.log("Timeout reached, transcript:", finalTranscript);
          resolve(finalTranscript);
        }
      }, 15000);
    });
  }

  // --------------------------------------------------
  // INICIAR GRAVAÇÃO
  // --------------------------------------------------
  async function startRecordingHandler() {
    setRecordLabel("Pause Recording");
    setRecording(true);
    setRecordingStartTime(Date.now());

    try {
      const transcript = await startRecognitionAsync();
      setLastTranscript(transcript);
    } catch (error) {
      console.error("Recognition error:", error);
    }
  }

  // --------------------------------------------------
  // PARAR GRAVAÇÃO
  // --------------------------------------------------
  function stopRecordingHandler() {
    const elapsed = Date.now() - recordingStartTime;
    // Exige, por exemplo, pelo menos 1 segundo de gravação
    if (elapsed < 1000) {
      addMessage(
        "ai",
        "Recording too short. Please record for at least 1 second."
      );
      speakAiText("Recording too short. Please record for at least 1 second.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecording(false);
    setRecordLabel("Start Recording");
    setRecognizing(false);

    if (lastTranscript.trim().length > 0) {
      addMessage("user", lastTranscript);
      addAiMessage(`Oh, awesome, ${userName}!`);
    } else {
      addMessage("user", "(No response)");
    }
    setLastTranscript("");
  }

  // --------------------------------------------------
  // TOGGLE DE GRAVAÇÃO
  // --------------------------------------------------
  async function toggleRecording() {
    if (!recording) {
      await startRecordingHandler();
    } else {
      stopRecordingHandler();
    }
  }

  // --------------------------------------------------
  // AVANÇAR PERGUNTA
  // --------------------------------------------------
  function nextQuestionHandler() {
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      addAiMessage(questions[nextIndex]);
      setRecordLabel("Start Recording");
    } else {
      addAiMessage(
        "Thank you for your responses. The interview is now complete."
      );
    }
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <Layout>
      {/*
          A ideia é ter um Container com:
          - "pb: '120px'" para evitar sobreposição no footer
          - "minHeight: 'calc(100vh - 80px)'" ou algo parecido
            para garantir espaço total na tela
        */}
      <Container
        sx={{
          mt: 4,
          mb: 4,
          pb: "120px", // aumenta padding-bottom para não sobrepor o footer
          minHeight: "calc(100vh - 160px)", // ajusta conforme seu footer
        }}
      >
        <Typography variant="h4" gutterBottom>
          Interview Session
        </Typography>
        <Typography variant="body1" gutterBottom>
          Hello, {userName}! Lets begin your interview.
        </Typography>

        <Stack direction="column" spacing={2}>
          {/* Área das Câmeras */}
          <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
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

          {/* Área de Controle: labels e botões em colunas */}
          <Stack direction="row" spacing={4} alignItems="center">
            <Stack direction="column" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {recordLabel}
              </Typography>
              <Button
                variant="contained"
                onClick={toggleRecording}
                disabled={recognizing}
              >
                {recording ? <StopIcon /> : <MicIcon />}
              </Button>
            </Stack>

            <Stack direction="column" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {nextLabel}
              </Typography>
              <Button variant="contained" onClick={nextQuestionHandler}>
                <ArrowForwardIcon />
              </Button>
            </Stack>
          </Stack>

          {/* Área de Chat */}
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
            {/* Se quiser mostrar "Listening..." quando a API estiver processando */}
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
