import { Box, Grid, Paper, Button } from "@mantine/core";
import { Toaster } from "react-hot-toast";
import { SignupForm } from "@/components/forms/SignupForm";
import { SignupHero } from "./Hero";
import { useSignup } from "@/hooks/auth/useSignup";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";

export default function Signup() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    errors,
    password,
    isRegistering,
    errorMessage,
    trigger,       
    getValues,     
    handleEmailSignup,
    handleGoogleSignup,
  } = useSignup();

  return (
    <Box h="100vh" style={{ overflow: "hidden" }}>
      <Button
        variant="default"
        radius="xl"
        size="sm"
        leftSection={<IconArrowLeft size={16} />}
        style={{ 
          position: 'fixed', 
          top: 20, 
          left: 20, 
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => navigate('/')}
      >
        Back to Home
      </Button>
      <Toaster />
      
      <Grid h="100%" gutter={0}>
        <SignupHero />
        
        <Grid.Col span={6}>
          <Paper
            h="100vh"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <SignupForm
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              password={password}
              isRegistering={isRegistering}
              errorMessage={errorMessage}
              onSubmit={handleEmailSignup}
              onGoogleSignup={handleGoogleSignup}
              trigger={trigger}        // ← Pass this
              getValues={getValues}    // ← Pass this
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}