import { z } from "zod"


export const SignUpFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "O e-mail digitado está inválido",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }),
  confirmPassword: z.string().min(2, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }),
  
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas precisam ser iguais",
  path: ["confirmPassword"],
});

export const LoginFormSchema = z.object({
  email: z.string().email({
    message: "O e-mail digitado está inválido",
  }),
  password: z.string().min(1, {
    message: "A senha é obrigatória.",
  }), 
  
}) 