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

// Importa os arquivos JSON
import initialScreening from "../data/initialScreening.json";
import javaQuestions from "../data/java.json";
import springbootQuestions from "../data/springboot.json";
import { useRouter } from "next/router";

interface Message {
  sender: "ai" | "user";
  text: string;
}

// Função para embaralhar e selecionar 'num' perguntas únicas
function pickRandomQuestions(all: string[], num: number = 10): string[] {
  const shuffled = [...all].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

export default function Interview() {
  // -------------------------------
  // ESTADOS DO USUÁRIO E ENTREVISTA
  // -------------------------------
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Guest");
  const [userEmail, setUserEmail] = useState<string>("no-email@domain.com");
  const [interviewTopic, setInterviewTopic] = useState<string>("General");

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);

  // -------------------------------
  // ESTADOS DE GRAVAÇÃO E RECONHECIMENTO
  // -------------------------------
  const [recording, setRecording] = useState<boolean>(false);
  const [recognizing, setRecognizing] = useState<boolean>(false);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  // Labels para os botões
  const [recordLabel, setRecordLabel] = useState<string>("Start Recording");
  const [nextLabel] = useState<string>("Next Question");

  // -------------------------------
  // REFERÊNCIAS
  // -------------------------------
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);
  // Ref para garantir que a primeira pergunta seja setada apenas uma vez
  const initialQuestionSet = useRef<boolean>(false);

  // -------------------------------
  // EFEITO INICIAL
  // -------------------------------
  useEffect(() => {
    // Recupera dados do localStorage (definidos pelo modal na página de teste)
    const storedName = localStorage.getItem("userName") || "Guest";
    const storedEmail =
      localStorage.getItem("userEmail") || "no-email@domain.com";
    const storedTopic =
      localStorage.getItem("interviewTopic") || "initialScreening";

    setUserName(storedName);
    setUserEmail(storedEmail);
    setInterviewTopic(storedTopic);

    setupCamera();

    // Seleciona as perguntas com base no tópico escolhido
    let selectedQuestions: string[] = [];
    switch (storedTopic) {
      case "initialScreening":
        selectedQuestions = pickRandomQuestions(initialScreening, 10);
        break;
      case "java":
        selectedQuestions = pickRandomQuestions(javaQuestions, 10);
        break;
      case "springboot":
        selectedQuestions = pickRandomQuestions(springbootQuestions, 10);
        break;
      default:
        selectedQuestions = pickRandomQuestions(initialScreening, 10);
    }
    setQuestions(selectedQuestions);

    // Exibe a primeira pergunta apenas se ainda não foi setada
    if (selectedQuestions.length > 0 && !initialQuestionSet.current) {
      setCurrentQuestionIndex(0);
      addAiMessage(selectedQuestions[0]);
      initialQuestionSet.current = true;
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
      console.error("Error accessing camera/mic:", error);
    }
  }

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

  function stopRecordingHandler() {
    const elapsed = Date.now() - recordingStartTime;
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

  async function toggleRecording() {
    if (!recording) {
      await startRecordingHandler();
    } else {
      stopRecordingHandler();
    }
  }

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
      // Limpa os dados do localStorage após a entrevista
      setTimeout(() => {
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("interviewTopic");
      }, 3000);
    }
  }

  return (
    <Layout>
      <Container
        sx={{
          mt: 4,
          mb: 4,
          pb: "150px", // aumenta padding-bottom para evitar sobreposição do footer
          minHeight: "calc(100vh - 160px)",
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
                Interviewer IA
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Image
                  src={`https://aiavatar.com/globalImages/landingPage/variants/gaming.webp`}
                  alt="AI Avatar"
                  width={250}
                  height={250}
                  style={{ borderRadius: "50%" }}
                />
              </Box>
            </Paper>
          </Stack>

          {/* Área de Controle: labels e botões alinhados */}
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
                        src="https://aiavatar.com/globalImages/landingPage/variants/gaming.webp"
                        sx={{ width: 60, height: 60 }}
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
          {currentQuestionIndex + 1 >= questions.length && (
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => router.push("/")}
            >
              Go Home
            </Button>
          )}
        </Stack>
      </Container>
    </Layout>
  );
}
