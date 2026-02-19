import { Grid, Paper, Box } from "@mantine/core";
import { Toaster } from "react-hot-toast";
import { LoginHero } from "./Hero";
import { LoginForm } from "@/components/forms/LoginForm";
import { useLogin } from "@/hooks/auth/useLogin"; 


export default function Login() {
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