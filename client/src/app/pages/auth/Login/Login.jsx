import { Grid, Paper, Box, Button } from "@mantine/core";
import { Toaster } from "react-hot-toast";
import { LoginHero } from "./Hero";
import { LoginForm } from "@/components/forms/LoginForm";
import { useLogin } from "@/hooks/auth/useLogin"; 
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react"; 
import { showSuccess } from "@utils/notification";


export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state;
    if (!state || !state.signupSuccess) return;

    showSuccess('Account Created', state.signupMessage || 'Verify the email first, then sign in.');

    // Clear the state so the notification doesn't reappear on refresh/back.
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);
  // Call the hook HERE in the page component
  const {
    register,       
    handleSubmit,    
    errors,          
    isSigningIn,
    errorMessage,

    handleEmailSignIn,
    handleGoogleSignIn,
  } = useLogin();



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
        <LoginHero />
        
        {/* Right Side - Login Form */}
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
            {/* Pass React Hook Form props to LoginForm */}
            <LoginForm
              register={register}         
              handleSubmit={handleSubmit}   
              errors={errors}             
              isSigningIn={isSigningIn}
              errorMessage={errorMessage}
              onSubmit={handleEmailSignIn}  
              onGoogleSignIn={handleGoogleSignIn}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}