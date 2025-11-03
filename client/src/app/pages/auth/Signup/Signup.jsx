import { Grid, Paper, Box } from "@mantine/core";
import { Toaster } from "react-hot-toast";
import { SignupHero } from "./hero";
import { SignupForm } from "@/components/forms/SignupForm";
import { useSignup } from "@/hooks/auth/useSignup"; // ← Hook imported HERE in the PAGE

export default function Signup() {
  // Call the hook HERE in the page component
  const {
    register,        // ← From React Hook Form
    handleSubmit,    // ← From React Hook Form
    errors,          // ← From React Hook Form
    password,        // ← From React Hook Form watch()
    trigger,         // ← From React Hook Form
    getValues,       // ← From React Hook Form
    isRegistering,
    errorMessage,
    handleEmailSignup,
    handleGoogleSignup,
  } = useSignup();

  return (
    <Box h="100vh" style={{ overflow: "hidden" }}>
      <Toaster />

      <Grid h="100%" gutter={0}>
        <SignupHero />

        {/* Right Side - Register Form */}
        <Grid.Col span={6}>
          <Paper
            h="100vh"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "1rem",
            }}
          >
            {/* Pass React Hook Form props to SignupForm */}
            <SignupForm
              register={register}           // ← React Hook Form
              handleSubmit={handleSubmit}   // ← React Hook Form
              errors={errors}               // ← React Hook Form
              password={password}           // ← React Hook Form watch
              trigger={trigger}             // ← React Hook Form
              getValues={getValues}         // ← React Hook Form
              isRegistering={isRegistering}
              errorMessage={errorMessage}
              onSubmit={handleEmailSignup}  // ← Custom handler
              onGoogleSignup={handleGoogleSignup} // ← Custom handler
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}