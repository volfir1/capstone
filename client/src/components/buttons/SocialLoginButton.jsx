import { Button } from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";

export const SocialLoginButton = ({ onClick, loading, variant = "login" }) => {
  const buttonText = variant === "signup" 
    ? "Continue with Google" 
    : "Continue with Google";

  return (
    <Button
      leftSection={<IconBrandGoogle size={variant === "signup" ? 18 : 20} />}
      variant="outline"
      size={variant === "signup" ? "sm" : "md"}
      radius="md"
      fullWidth
      color="gray.6"
      c="dark"
      onClick={onClick}
      loading={loading}
    >
      {buttonText}
    </Button>
  );
};