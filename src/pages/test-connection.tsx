// pages/test-connection.tsx
import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Stack,
  LinearProgress,
} from "@mui/material";
import Layout from "../components/Layout";
import TestCard from "../components/TestCard";

export default function TestConnection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const [micTestMessage, setMicTestMessage] = useState<string>("");
  const [recording, setRecording] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);

  // Função para iniciar o medidor de áudio usando a API Web Audio
  const startMicLevelMeter = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMicLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      // Calcula o valor médio do volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setMicLevel(average);
      requestAnimationFrame(updateMicLevel);
    };

    updateMicLevel();
  };

  // Função para testar a câmera
  const handleTestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  // Função para testar o compartilhamento de tela (o usuário deve escolher a aba da nossa aplicação)
  const handleTestScreen = async () => {
    try {
      alert(
        "For best results, please select the tab of this application when prompted."
      );
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
      });
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
        screenRef.current.play();
      }
    } catch (err) {
      console.error("Screen sharing error:", err);
    }
  };

  // Função para testar o microfone: grava 3 segundos, reproduz o áudio e ativa o medidor
  const handleTestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Inicia o medidor de áudio
      startMicLevelMeter(stream);

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        const audioURL = URL.createObjectURL(blob);
        const audio = new Audio(audioURL);
        audio.play();
        setMicTestMessage("Microphone test completed: playback started.");
      };

      setRecording(true);
      mediaRecorder.start();

      // Grava por 3 segundos e para a gravação
      setTimeout(() => {
        mediaRecorder.stop();
        setRecording(false);
      }, 3000);
    } catch (err) {
      console.error("Microphone error:", err);
      setMicTestMessage("Error testing microphone.");
    }
  };

  return (
    <Layout>
      <Container>
        <Typography variant="h4" gutterBottom>
          Connection Test
        </Typography>
        <Typography variant="body1" gutterBottom>
          Please test your camera, microphone, and screen sharing before
          starting the interview.
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          alignItems="stretch"
        >
          {/* Teste da Câmera */}
          <TestCard
            title="Test Camera"
            buttonLabel="Start Camera"
            onTest={handleTestCamera}
          >
            <Box sx={{ mt: 2 }}>
              <video
                ref={videoRef}
                width="100%"
                autoPlay
                muted
                style={{ borderRadius: 4, transform: "scaleX(-1)" }} // Corrige a inversão
              />
            </Box>
          </TestCard>

          {/* Teste do Microfone */}
          <TestCard
            title="Test Microphone"
            buttonLabel={recording ? "Recording..." : "Start Mic Test"}
            onTest={handleTestMic}
          >
            {micTestMessage && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                {micTestMessage}
              </Typography>
            )}
            {/* Medidor de áudio */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">Mic Level:</Typography>
              <LinearProgress
                variant="determinate"
                value={(micLevel / 255) * 100}
              />
            </Box>
          </TestCard>

          {/* Teste do Compartilhamento de Tela */}
          <TestCard
            title="Test Screen Sharing"
            buttonLabel="Start Screen Share"
            onTest={handleTestScreen}
          >
            <Box sx={{ mt: 2 }}>
              <video
                ref={screenRef}
                width="100%"
                autoPlay
                muted
                style={{ borderRadius: 4 }}
              />
            </Box>
          </TestCard>
        </Stack>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button variant="contained" color="primary" size="large">
            Proceed to Interview
          </Button>
        </Box>
      </Container>
    </Layout>
  );
}
