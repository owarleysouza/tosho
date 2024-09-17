import { z } from "zod"

// Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
const passwordValidation = new RegExp(
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
);

//Just accept characters and accents, not spaces, special character and numbers
const usernameValidation = new RegExp(/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/);

//It doesn't permit only spaces, or numbers or special character
const shopNameValidation = new RegExp(/^(?![\s\d]*$)(?![\W_]*$).*$/);


export const SignUpFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "O nome deve ter pelo menos 2 caracteres.",
    })
    .regex(usernameValidation, {
      message: 'Nome inválido',
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

export const RecoveryPasswordFormSchema = z.object({
  email: z.string().email({
    message: "O e-mail digitado está inválido",
  }), 
}) 

export const ShopCreateFormSchema = z.object({ 
  name: z
    .string()
    .min(5, {
      message: "O nome deve ter pelo menos 5 caracteres.",
    })
    .max(30, {
      message: "O nome deve ter no máximo 30 caracteres.",
    })
    .regex(shopNameValidation, {
      message: 'Nome inválido',
    }), 
  date: z.date({
    required_error: "A data é necessária.",
  }),
  isDone: z.boolean(),
  total: z.number()
}) 

export const ProductsCreateFormSchema = z.object({ 
  text: z
    .string()
    .min(2, {
      message: "É obrigatório digitar ao menos um produto.",
    })
    .max(350, {
      message: "Número máximo de produtos por vez atingido",
    })
}) 

export const ProductEditFormSchema = z.object({ 
  name: z
    .string()
    .trim()
    .min(2, {
      message: "Número mínimo de caracteres não atingido",
    })
    .max(25, {
      message: "Número máximo de caracteres atingido",
    }),
  quantity: z
    .coerce.number({message: "Quantidade inválida"})
    .int()
    .positive({message: "Quantidade precisa ser positiva"}),
  category: z
    .string()
    .min(2, {
      message: "Número mínimo de caracteres não atingido",
    }),
  description: z
    .string()
    .max(25, {
      message: "Número máximo de caracteres atingido",
    })
    .optional(), 
  price: z
  .string()
  .catch((ctx) => ctx.input.toString())
  .transform((val) => val.replace(',', '.'))  
  .pipe(
    z.coerce.number({ message: "Preço Inválido" })
      .nonnegative({ message: "Preço precisa ser positivo" })
      .optional()
  )
  }) 


