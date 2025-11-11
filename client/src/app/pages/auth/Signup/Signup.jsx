import { Box, Grid, Paper } from "@mantine/core";
import { Toaster } from "react-hot-toast";
import { SignupForm } from "@/components/forms/SignupForm";
import { SignupHero } from "./Hero";
import { useSignup } from "@/hooks/auth/useSignup";

export default function Signup() {
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