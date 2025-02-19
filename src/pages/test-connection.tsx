// pages/test-connection.tsx
import React, { useState, useRef } from "react";
import { Box, Button, Typography, Stack, LinearProgress } from "@mui/material";
import Layout from "../components/Layout";
import TestCard from "../components/TestCard";
import { useRouter } from "next/router";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function TestConnection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  // Estados para indicar se cada teste foi concluído
  const [cameraTested, setCameraTested] = useState<boolean>(false);
  const [micTested, setMicTested] = useState<boolean>(false);
  const [screenTested, setScreenTested] = useState<boolean>(false);

  const [micTestMessage, setMicTestMessage] = useState<string>("");
  const [recording, setRecording] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);

  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);

  // Exemplo simples de finalização do teste
  const handleCompleteTests = () => {
    // Aqui você pode garantir que câmera, mic e tela foram testados
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
  };

  // Quando o usuário confirma nome/e-mail no modal
  const handleConfirm = (name: string, email: string, topic: string) => {
    // Salva no localStorage
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("interviewTopic", topic);
    setOpenModal(false);
    // Redireciona para a página de entrevista
    router.push("/interview");
  };

  // Função para iniciar o medidor de áudio via Web Audio API
  const startMicLevelMeter = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMicLevel = () => {
      analyser.getByteFrequencyData(dataArray);
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

  // Teste da Câmera
  const handleTestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraTested(true); // Marcar o teste da câmera como concluído
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  // Teste do Compartilhamento de Tela (o usuário deve selecionar a aba da nossa aplicação)
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
        setScreenTested(true); // Marcar o teste da tela como concluído
      }
    } catch (err) {
      console.error("Screen sharing error:", err);
    }
  };

  // Teste do Microfone: grava 3 segundos, reproduz o áudio, inicia o medidor e marca o teste como concluído
  const handleTestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        setMicTested(true); // Marcar o teste do microfone como concluído
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

  // Verifica se todos os testes foram concluídos
  //const allTestsPassed = cameraTested && micTested && screenTested;

  return (
    <Layout>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Test Your Devices
        </Typography>
        <Typography variant="body1" gutterBottom>
          Please ensure your camera, microphone, and screen sharing are working
          properly.
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          alignItems="stretch"
        >
          {/* Teste da Câmera */}
          <Box sx={{ minHeight: 300, flex: 1 }}>
            <TestCard
              title="Test Camera"
              buttonLabel="Start Camera"
              onTest={handleTestCamera}
              tested={cameraTested}
            >
              <Box sx={{ mt: 2 }}>
                <video
                  ref={videoRef}
                  width="100%"
                  autoPlay
                  muted
                  style={{ borderRadius: 4, transform: "scaleX(-1)" }}
                />
              </Box>
            </TestCard>
          </Box>

          {/* Teste do Microfone */}
          <Box sx={{ minHeight: 300, flex: 1 }}>
            <TestCard
              title="Test Microphone"
              buttonLabel={recording ? "Recording..." : "Start Mic Test"}
              onTest={handleTestMic}
              tested={micTested}
            >
              {micTestMessage && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {micTestMessage}
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">Mic Level:</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(micLevel / 255) * 100}
                />
              </Box>
            </TestCard>
          </Box>

          {/* Teste do Compartilhamento de Tela */}
          <Box sx={{ minHeight: 300, flex: 1 }}>
            <TestCard
              title="Test Screen Sharing"
              buttonLabel="Start Screen Share"
              onTest={handleTestScreen}
              tested={screenTested}
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
          </Box>
        </Stack>

        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={handleCompleteTests}
        >
          Proceed to Interview
        </Button>
      </Box>

      <ConfirmationModal
        open={openModal}
        onClose={handleModalClose}
        onConfirm={handleConfirm}
      />
    </Layout>
  );
}
