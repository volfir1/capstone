import toast from "react-hot-toast";

export const successNotif = () => toast.success("Login Success");
export const failNotif = () => toast.error("Invalid Credentials fam");
export const verificationNotif = () => toast.error("Please verify your email first");
export const welcomeNotif = () => () => toast.success(`Welcome back, ${firstName}!`)