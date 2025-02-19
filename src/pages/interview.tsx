// pages/interview.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Avatar,
} from "@mui/material";
import Layout from "../components/Layout";
import Image from "next/image";

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

// Definição dos tipos para SpeechRecognition
interface CustomSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

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

interface Message {
  sender: "ai" | "user";
  text: string;
}

export default function Interview() {
  // Dados do usuário (salvos na tela de teste/modal)
  const [userName, setUserName] = useState<string>("Guest");
  const [userEmail, setUserEmail] = useState<string>("no-email@domain.com");
  const [interviewTopic, setInterviewTopic] = useState<string>("General");

  // Histórico da conversa
  const [messages, setMessages] = useState<Message[]>([]);
  // Array de perguntas simuladas (substitua por consulta real se desejar)
  const [questions, setQuestions] = useState<string[]>([]);
  // Índice da pergunta atual
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  // Flag para indicar se estamos ouvindo o usuário
  const [recognizing, setRecognizing] = useState<boolean>(false);

  // Referências
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);

  useEffect(() => {
    // Recupera dados do localStorage
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const storedTopic = localStorage.getItem("interviewTopic");
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
    if (storedTopic) setInterviewTopic(storedTopic);

    // Configura a câmera do usuário
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
    setupCamera();

    // Simula consulta para obter 10 perguntas sobre o tema
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

    // Inicia a entrevista com a primeira pergunta
    if (simulatedQuestions.length > 0) {
      askQuestion(simulatedQuestions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Faz a IA falar via TTS */
  const speakAiText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  /** Exibe a pergunta atual no chat, fala e inicia a captura da resposta */
  const askQuestion = (question: string) => {
    const aiMessage: Message = { sender: "ai", text: question };
    setMessages((prev) => [...prev, aiMessage]);
    speakAiText(question);
    // Inicia o reconhecimento para captar a resposta do usuário
    startRecognition();
  };

  /** Inicializa a captura de voz do usuário usando a API Web Speech */
  const startRecognition = () => {
    if (
      !("SpeechRecognition" in window) &&
      !("webkitSpeechRecognition" in window)
    ) {
      alert("Your browser does not support speech recognition.");
      return;
    }
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setRecognizing(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      const userMessage: Message = { sender: "user", text: transcript };
      setMessages((prev) => [...prev, userMessage]);
      setRecognizing(false);
      // Avança para a próxima pergunta após um pequeno delay
      setTimeout(() => {
        proceedToNextQuestion();
      }, 1500);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setRecognizing(false);
    };

    recognition.start();
  };

  /** Avança para a próxima pergunta, se houver */
  const proceedToNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      askQuestion(questions[nextIndex]);
    } else {
      // Fim da entrevista
      const endMessage: Message = {
        sender: "ai",
        text: "Thank you for your responses. The interview is now complete.",
      };
      setMessages((prev) => [...prev, endMessage]);
      speakAiText(endMessage.text);
      // Aqui você pode chamar uma função para enviar a transcrição por e-mail e limpar o localStorage
    }
  };

  return (
    <Layout>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Interview Session
        </Typography>
        <Typography variant="body1" gutterBottom>
          Name: {userName} | Email: {userEmail} | Topic: {interviewTopic}
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mt: 2 }}
        >
          {/* Coluna 1: Câmera do Usuário */}
          <Paper
            sx={{
              p: 2,
              flex: 1,
              textAlign: "center",
              backgroundColor: "#2F394A",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              {userName} Camera
            </Typography>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <video
                ref={userVideoRef}
                width="100%"
                autoPlay
                muted
                style={{ borderRadius: 8, maxWidth: 400 }}
              />
            </Box>
          </Paper>

          {/* Coluna 2: Avatar da IA */}
          <Paper
            sx={{
              p: 2,
              flex: 1,
              textAlign: "center",
              backgroundColor: "#2F394A",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Talently AI
            </Typography>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <Image
                src="/images/ai-avatar.png"
                alt="AI Avatar"
                width={200}
                height={200}
                style={{ borderRadius: "50%" }}
              />
            </Box>
          </Paper>

          {/* Coluna 3: Chat/Transcripts */}
          <Paper
            sx={{
              p: 2,
              flex: 1.2,
              backgroundColor: "#1F1F1F",
              color: "#FFFFFF",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Conversation
            </Typography>
            {/* Usando List para simular um chat estilo WhatsApp */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                p: 1,
                borderRadius: 1,
                minHeight: 300,
              }}
            >
              {messages.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    mb: 1,
                    display: "flex",
                    justifyContent:
                      msg.sender === "ai" ? "flex-start" : "flex-end",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {msg.sender === "ai" ? (
                      <Avatar src="/images/ai-avatar.png" sx={{ mr: 1 }} />
                    ) : (
                      <Avatar sx={{ mr: 1 }}>{userName.charAt(0)}</Avatar>
                    )}
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: "20px",
                        backgroundColor:
                          msg.sender === "ai" ? "#333" : "#4CAF50",
                        color: "#fff",
                        maxWidth: "80%",
                      }}
                    >
                      <Typography variant="body2">{msg.text}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
              {recognizing && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Listening...
                </Typography>
              )}
            </Box>
            {/* Você pode adicionar botões extras aqui para enviar o transcript por e-mail, etc. */}
          </Paper>
        </Stack>
      </Container>
    </Layout>
  );
}
