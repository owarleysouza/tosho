import { z } from "zod"

// Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
const passwordValidation = new RegExp(
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
);

export const SignUpFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "O e-mail digitado está inválido",
  }),
  password: z
    .string()
    .min(8, {
      message: "A senha deve ter pelo menos 8 caracteres.",
    })
    .regex(passwordValidation, {
      message: 'A senha deve conter letra maiúscula, letra minúscula, número e caractere especial',
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