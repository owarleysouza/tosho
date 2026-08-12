import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import FormInput from '@/components/form/FormInput'
import { Loader2 } from "lucide-react"

import { useForm } from "react-hook-form"
import { TemplateCreateFormSchema } from "@/utils/formValidations"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { collection, addDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"
import { DEFAULT_TEMPLATE_ICON, TEMPLATE_ICONS } from "@/utils/templateIcons"
import type { TemplateCardData } from "@/components/templates/TemplateCard"

import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface TemplateFormDialogProps {
  onSaved: () => void;
  // Lets callers render this both as the full-width empty-state CTA and as a
  // compact trigger next to an existing list (same convention as
  // ShopFormDialog).
  trigger?: React.ReactNode;
  // Presence of `template` switches the form to edit mode (HU-27): prefilled
  // values, updateDoc instead of addDoc — same convention as ShopFormDialog's
  // `shop` prop.
  template?: TemplateCardData;
  // Controlled open state — same convention as ShopFormDialog, for callers
  // that need to open this without nesting a Trigger inside another Radix
  // trigger.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function buildDefaultValues(template?: TemplateCardData) {
  return {
    name: template?.name ?? "",
    description: template?.description ?? "",
    icon: (template?.icon as z.infer<typeof TemplateCreateFormSchema>["icon"]) ?? DEFAULT_TEMPLATE_ICON,
  }
}

const TemplateFormDialog: React.FC<TemplateFormDialogProps> = ({
  onSaved,
  trigger,
  template,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}) => {
  const isEditMode = !!template

  const isControlled = controlledOpen !== undefined

  const [loading, setLoading] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = setControlledOpen ?? setInternalOpen

  const { user } = useContext(UserContext)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof TemplateCreateFormSchema>>({
    resolver: zodResolver(TemplateCreateFormSchema),
    defaultValues: buildDefaultValues(template),
  })

  // Same react-hook-form gotcha as ShopFormDialog: defaultValues only apply
  // once, at mount — this component stays mounted between opens, so reset
  // explicitly every time it opens instead of showing stale values.
  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(template))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = async (data: z.infer<typeof TemplateCreateFormSchema>): Promise<void> => {
    try {
      setLoading(true)
      if (!user) return

      if (isEditMode) {
        const templateRef = doc(db, "users", user.uid, "templates", template.uid)
        await updateDoc(templateRef, {
          name: data.name,
          description: data.description || "",
          icon: data.icon,
        })

        toast({
          variant: "success",
          title: "Sucesso!",
          description: "Template atualizado",
        })
      } else {
        // RN-23 — valid with zero items; itemsCount starts at 0 and is
        // maintained by increment() once HU-23 adds items, same convention
        // as shops' itemsCount.
        await addDoc(collection(db, "users", user.uid, "templates"), {
          name: data.name,
          description: data.description || "",
          icon: data.icon,
          itemsCount: 0,
          createdAt: serverTimestamp(),
        })

        toast({
          variant: "success",
          title: "Sucesso!",
          description: "Template criado",
        })
      }

      setOpen(false)
      onSaved()
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: isEditMode
          ? "Um erro inesperado aconteceu ao atualizar o template"
          : "Um erro inesperado aconteceu ao criar o template",
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className='w-[320px] rounded-full'>Novo template</Button>
  )

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormInput
          formControl={form.control}
          name="name"
          label="Nome"
          placeholder="Compra básica"
        />

        <FormInput
          formControl={form.control}
          name="description"
          label="Descrição"
          placeholder="Itens fixos do mês"
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-[11px] font-medium uppercase tracking-wide text-tosho-700">
                Ícone
              </FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  // Same guard as the category chips elsewhere: Radix lets
                  // you deselect the active item in single mode, which would
                  // leave the template with no icon at all.
                  onValueChange={(value) => {
                    if (value) field.onChange(value)
                  }}
                  // flex-wrap — 7 fixed 36px icons plus gaps (~288px) don't
                  // fit in the ~240px of content width a narrow phone leaves
                  // inside this dialog's padding; without wrapping they just
                  // overflowed the dialog horizontally instead of wrapping
                  // to a second row. justify-start (overriding the base
                  // component's justify-center) so icons pack left with a
                  // fixed gap instead of stretching to fill each row.
                  className="flex-wrap justify-start gap-2"
                >
                  {TEMPLATE_ICONS.map(({ key, icon: Icon }) => (
                    <ToggleGroupItem
                      key={key}
                      value={key}
                      aria-label={key}
                      className={cn(
                        "h-9 w-9 shrink-0 rounded-full border border-border bg-background text-tosho-700",
                        "data-[state=on]:border-primary data-[state=on]:bg-secondary data-[state=on]:text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button disabled={loading} type="submit" className='w-full rounded-full'>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isEditMode ? "Salvar alterações" : "Criar template"}
        </Button>
      </form>
    </Form>
  )

  const title = isEditMode ? "Editar template" : "Novo template"
  const description = isEditMode
    ? "Atualize o nome ou a descrição do template."
    : "Crie um modelo reutilizável para compras futuras."

  // Same centered Dialog on every viewport now — see ProductEditDialog for
  // why the mobile bottom Drawer was dropped (vaul's swipe-to-dismiss kept
  // misreading our keyboard-avoidance positioning as a drag and closing on
  // an ordinary tap between fields).
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      )}
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-[400px] max-h-[85vh] overflow-x-hidden overflow-y-auto rounded-lg"
        onInteractOutside={(e) => { e.preventDefault() }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}

export default TemplateFormDialog
