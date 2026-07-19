import { SignupForm } from "@/components/forms/SignupForm";
import { useSignup } from "@/hooks/auth/useSignup";

export default function Signup() {
  const {
    register,
    handleSubmit,
    errors,
    password,
    isRegistering,
    errorMessage,
    onSubmit,
    onGoogleSignup,
  } = useSignup();

  return (
    <SignupForm
      register={register}
      handleSubmit={handleSubmit}
      errors={errors}
      password={password}
      isRegistering={isRegistering}
      errorMessage={errorMessage}
      onSubmit={onSubmit}
      onGoogleSignup={onGoogleSignup}
    />
  );
}
