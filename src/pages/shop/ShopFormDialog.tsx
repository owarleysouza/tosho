import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import FormInput from '@/components/form/FormInput'
import FormDateTimePicker from '@/components/form/FormDateTimePicker'
import { ArrowLeft, FilePlus2, LayoutTemplate, History, Loader2 } from "lucide-react"

import { useForm } from "react-hook-form"
import { ShopCreateFormSchema, ShopStartingPointEnum } from "@/utils/formValidations"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { collection, addDoc, doc, getDocs, query, serverTimestamp, updateDoc, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"
import { addProductsToShop } from "@/utils/addProductsToShop"
import { getTemplateIcon } from "@/utils/templateIcons"
import StepDots from "@/components/commom/StepDots"

import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '@/context/commom/UserContext'
import { useToast } from "@/components/ui/use-toast"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"

export interface EditableShop {
  uid: string;
  name: string;
  scheduledAt?: Timestamp;
  date?: Timestamp; // legacy fallback for shops created before scheduledAt (HU-16)
}

interface ShopFormDialogProps {
  onSaved: () => void;
  // Lets callers render this both as the full-width empty-state CTA and as a
  // compact trigger next to an already-active purchase.
  trigger?: React.ReactNode;
  // Presence of `shop` switches the form to edit mode (HU-18): prefilled
  // values, no starting-point step, updateDoc instead of addDoc.
  shop?: EditableShop;
  // Controlled open state — used when a caller (e.g. a DropdownMenuItem)
  // needs to open this without nesting a Trigger inside another Radix
  // trigger (dropdown item + dialog trigger fight over focus). When omitted,
  // the dialog manages its own open state internally via `trigger`.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// "template" (HU-29) and "previous" (HU-20) are each enabled based on
// whether there's actually something to clone from.
const startingPointOptions: Array<{
  value: z.infer<typeof ShopStartingPointEnum>;
  icon: React.ElementType;
  title: string;
  description: string;
}> = [
  {
    value: 'scratch',
    icon: FilePlus2,
    title: 'Do zero',
    description: 'Começar com lista vazia',
  },
  {
    value: 'template',
    icon: LayoutTemplate,
    title: 'Carregar template',
    description: 'Usar um modelo salvo',
  },
  {
    value: 'previous',
    icon: History,
    title: 'Compra anterior',
    description: 'Usar última compra como base',
  },
]

function buildDefaultValues(shop?: EditableShop) {
  return {
    name: shop?.name ?? "",
    scheduledAt: shop ? (shop.scheduledAt ?? shop.date)?.toDate() : undefined,
    startingPoint: "scratch" as const,
  }
}

interface CompletedShopCandidate {
  uid: string;
  completedAt?: Timestamp;
  scheduledAt?: Timestamp;
  date?: Timestamp; // legacy fallback, same as EditableShop
}

interface TemplateCandidate {
  uid: string;
  name: string;
  description?: string;
  itemsCount?: number;
  icon?: string;
}

// RN-06-style "which one" helper, symmetrical to getActivePurchase but for
// the most recent *completed* purchase instead of the closest pending one.
// Only one call site today, so it stays local instead of a shared util.
function getMostRecentCompletedShop(
  shops: CompletedShopCandidate[]
): CompletedShopCandidate | undefined {
  return shops.reduce<CompletedShopCandidate | undefined>((latest, shop) => {
    const shopMillis = (shop.completedAt ?? shop.scheduledAt ?? shop.date)?.toMillis() ?? -Infinity
    const latestMillis = (latest?.completedAt ?? latest?.scheduledAt ?? latest?.date)?.toMillis() ?? -Infinity
    return shopMillis > latestMillis ? shop : latest
  }, undefined)
}

const ShopFormDialog: React.FC<ShopFormDialogProps> = ({
  onSaved,
  trigger,
  shop,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}) => {
  const isEditMode = !!shop

  const isControlled = controlledOpen !== undefined

  const [loading, setLoading] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = setControlledOpen ?? setInternalOpen

  const isDesktop = useMediaQuery('(min-width: 768px)')

  const { user } = useContext(UserContext)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof ShopCreateFormSchema>>({
    resolver: zodResolver(ShopCreateFormSchema),
    defaultValues: buildDefaultValues(shop),
  })

  // HU-29 — step 2 ("Selecionar template") only exists when "Carregar
  // template" is chosen; every other path stays single-step (RN-26).
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)

  // react-hook-form only applies defaultValues once, at mount — since this
  // component (and its underlying Dialog/Drawer) stays mounted between opens,
  // re-sync the form to the current shop every time it opens instead of
  // showing whatever was there the first time.
  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(shop))
      setStep(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // HU-20 — "Compra anterior" only makes sense (and is only enabled) once at
  // least one completed purchase exists. Fetched on mount rather than on
  // open: this component is already sitting in the tree (as the "Nova
  // compra" trigger) well before the user actually clicks it, so by the
  // time the dialog opens the answer is already known — no disabled→enabled
  // flash on every open. Reused at submit time to pick the most recent one,
  // instead of a second read.
  const [completedShops, setCompletedShops] = useState<CompletedShopCandidate[]>([])

  useEffect(() => {
    async function loadCompletedShops() {
      if (isEditMode || !user) return

      try {
        const completedShopsRef = query(
          collection(db, 'users', user.uid, 'shops'),
          where('isDone', '==', true)
        )
        const snapshot = await getDocs(completedShopsRef)
        setCompletedShops(
          snapshot.docs.map((document) => ({
            uid: document.id,
            ...(document.data() as Omit<CompletedShopCandidate, 'uid'>),
          }))
        )
      } catch (error) {
        // Transient read failure — keep whatever was last known instead of
        // forcing the option back to disabled.
      }
    }

    loadCompletedShops()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, user])

  // HU-29 — "Carregar template" only makes sense (and is only enabled) once
  // at least one template exists. Same fetch-on-mount rationale as
  // completedShops above — known by the time the dialog actually opens.
  const [templates, setTemplates] = useState<TemplateCandidate[]>([])

  useEffect(() => {
    async function loadTemplates() {
      if (isEditMode || !user) return

      try {
        const templatesRef = collection(db, 'users', user.uid, 'templates')
        const snapshot = await getDocs(templatesRef)
        setTemplates(
          snapshot.docs.map((document) => ({
            uid: document.id,
            ...(document.data() as Omit<TemplateCandidate, 'uid'>),
          }))
        )
      } catch (error) {
        // Transient read failure — keep whatever was last known instead of
        // forcing the option back to disabled.
      }
    }

    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, user])

  // RN-23 — a template can exist with zero items, but there's nothing
  // useful to clone from one, so it's excluded from selection entirely
  // (both here, deciding whether "Carregar template" is even offered, and
  // in the step 2 list below) rather than shown disabled — simpler than a
  // second disabled-state treatment, and keeps the two checks from ever
  // disagreeing (option enabled but step 2 has nothing selectable).
  const templatesWithItems = templates.filter((template) => (template.itemsCount ?? 0) > 0)

  const disabledMap: Record<z.infer<typeof ShopStartingPointEnum>, boolean> = {
    scratch: false,
    template: templatesWithItems.length === 0,
    previous: completedShops.length === 0,
  }

  const onSubmit = async (data: z.infer<typeof ShopCreateFormSchema>): Promise<void> => {
    // RN-26 — "Carregar template" needs a second step (pick which one)
    // before there's anything to actually submit. Name/date/time are
    // already validated by this point (this only runs after RHF's own
    // handleSubmit passes), so step 2 never has to re-ask for them.
    if (!isEditMode && data.startingPoint === "template" && step === 1) {
      setStep(2)
      return
    }

    try {
      setLoading(true)
      if (!user) return

      if (isEditMode) {
        const shopRef = doc(db, `users/${user.uid}/shops`, shop.uid)
        await updateDoc(shopRef, {
          name: data.name,
          scheduledAt: data.scheduledAt,
        })

        toast({
          variant: "success",
          title: "Sucesso!",
          description: "Compra atualizada",
        })
      } else {
        const docRef = doc(db, "users", user.uid)
        const colRef = collection(docRef, "shops")
        const newShopRef = await addDoc(colRef, {
          name: data.name,
          scheduledAt: data.scheduledAt,
          isDone: false,
          total: 0,
          itemsCount: 0,
          createdAt: serverTimestamp(),
        })

        // RN-20/RN-21 — clone every item from the most recent completed
        // purchase as brand-new documents (own ids, no pointer back to the
        // source — editing/deleting one side never touches the other), all
        // reset to pending regardless of the source's own status (it's
        // completed, so every item there is currently marked done).
        if (data.startingPoint === "previous") {
          const sourceShop = getMostRecentCompletedShop(completedShops)

          if (sourceShop) {
            const sourceProductsRef = collection(
              db,
              `users/${user.uid}/shops/${sourceShop.uid}/products`
            )
            const sourceSnapshot = await getDocs(sourceProductsRef)
            const clonedProducts = sourceSnapshot.docs.map((productDoc) => {
              const { name, quantity, category, description } = productDoc.data()
              return { name, quantity, category, description, isDone: false }
            })

            await addProductsToShop(user.uid, newShopRef.id, clonedProducts)
          }
        }

        // RN-20/RN-21 — same cloning shape as "previous" above, just a
        // different source: every item from the chosen template, as
        // brand-new documents with no pointer back to it (RN-20 — editing/
        // deleting one side never touches the other), reset to pending
        // regardless of the source (template items have no completion
        // state to begin with, but the shape stays identical either way).
        if (data.startingPoint === "template") {
          const selectedId = selectedTemplateId ?? templatesWithItems[0]?.uid

          if (selectedId) {
            const sourceItemsRef = collection(
              db,
              `users/${user.uid}/templates/${selectedId}/items`
            )
            const sourceSnapshot = await getDocs(sourceItemsRef)
            const clonedProducts = sourceSnapshot.docs.map((itemDoc) => {
              const { name, quantity, category, description } = itemDoc.data()
              return { name, quantity, category, description, isDone: false }
            })

            await addProductsToShop(user.uid, newShopRef.id, clonedProducts)
          }
        }

        toast({
          variant: "success",
          title: "Sucesso!",
          description: "Compra adicionada",
        })
      }

      setOpen(false)
      onSaved()
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Ops! Algo de errado aconteceu",
        description: isEditMode
          ? "Um erro inesperado aconteceu ao atualizar a compra"
          : "Um erro inesperado aconteceu ao criar a compra"
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className='w-[320px] rounded-full'>Criar compra</Button>
  )

  // RN-26 — this is the only path that ever reaches a second step; "scratch"
  // and "previous" submit directly from step 1.
  const isTemplateStep2 = !isEditMode && step === 2

  // Step 1's submit button doesn't actually create anything while
  // "Carregar template" is selected — it advances to step 2 instead — so
  // it's labeled for what it really does instead of promising a purchase
  // that isn't created yet.
  const startingPoint = form.watch("startingPoint")
  const submitLabel = isEditMode
    ? "Salvar alterações"
    : !isTemplateStep2 && startingPoint === "template"
    ? "Selecionar template"
    : "Criar compra"

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        {isTemplateStep2 ? (
          <>
            <StepDots activeStep={2} />

            <RadioGroup
              value={selectedTemplateId ?? templatesWithItems[0]?.uid}
              onValueChange={setSelectedTemplateId}
              className="gap-2"
            >
              {templatesWithItems.map((template) => {
                const Icon = getTemplateIcon(template.icon)
                const isSelected =
                  (selectedTemplateId ?? templatesWithItems[0]?.uid) === template.uid
                const itemsLabel = `${template.itemsCount ?? 0} ${
                  template.itemsCount === 1 ? "item" : "itens"
                }`

                return (
                  <label
                    key={template.uid}
                    htmlFor={`template-${template.uid}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                      isSelected ? "border-primary bg-secondary" : "border-border bg-background"
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tosho-50 text-tosho-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {template.name}
                      </span>
                      <p className="truncate text-xs text-muted-foreground">
                        {itemsLabel}
                        {template.description ? ` · ${template.description}` : ""}
                      </p>
                    </div>
                    <RadioGroupItem id={`template-${template.uid}`} value={template.uid} />
                  </label>
                )
              })}
            </RadioGroup>
          </>
        ) : (
          <>
            {/* RN-26 — same dots as step 2, shown here too once "Carregar
                template" is picked, so the two-step nature of that path
                has context before advancing, not just once already there. */}
            {!isEditMode && startingPoint === "template" && (
              <StepDots activeStep={1} />
            )}

            <FormInput
              formControl={form.control}
              name="name"
              label="Nome"
              placeholder="Compra mensal"
            />

            <FormDateTimePicker
              formControl={form.control}
              name="scheduledAt"
              label="Data e hora"
              placeholder="Selecione data e hora"
            />

            {!isEditMode && (
              <FormField
                control={form.control}
                name="startingPoint"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-medium uppercase tracking-wide text-tosho-700">
                      Ponto de partida
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="gap-2"
                      >
                        {startingPointOptions.map((option) => {
                          const disabled = disabledMap[option.value]
                          // Each disabled option has its own reason — no
                          // shared label between them.
                          const disabledLabel =
                            option.value === "template"
                              ? "Nenhum template salvo"
                              : option.value === "previous"
                              ? "Nenhuma compra concluída"
                              : undefined

                          return (
                            <label
                              key={option.value}
                              htmlFor={`starting-point-${option.value}`}
                              className={cn(
                                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                                disabled
                                  ? "cursor-not-allowed opacity-60 border-border"
                                  : "cursor-pointer border-border",
                                !disabled && field.value === option.value
                                  ? "border-primary bg-secondary"
                                  : "bg-background"
                              )}
                            >
                              <option.icon className="h-5 w-5 text-tosho-700 shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">
                                    {option.title}
                                  </span>
                                  {disabled && disabledLabel && (
                                    <Badge variant="pending" className="text-[10px]">
                                      {disabledLabel}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {option.description}
                                </p>
                              </div>
                              <RadioGroupItem
                                id={`starting-point-${option.value}`}
                                value={option.value}
                                disabled={disabled}
                              />
                            </label>
                          )
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <Button disabled={loading} type="submit" className='w-full rounded-full'>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : submitLabel}
        </Button>

        {isTemplateStep2 && (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={() => setStep(1)}
          >
            Voltar
          </Button>
        )}
      </form>
    </Form>
  )

  const title = isTemplateStep2
    ? "Selecionar template"
    : isEditMode
    ? "Editar compra"
    : "Nova compra"
  const description = isTemplateStep2
    ? "Escolha o modelo para usar como base da nova compra."
    : isEditMode
    ? "Atualize o nome ou a data/hora da compra."
    : "Adicione uma compra a ser realizada."

  // Second way back to step 1, alongside the "Voltar" button at the
  // bottom of the form — both just flip `step`, no data is touched.
  const titleContent = (
    <span className="flex items-center gap-2">
      {isTemplateStep2 && (
        <button
          type="button"
          onClick={() => setStep(1)}
          aria-label="Voltar"
          className="text-tosho-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      {title}
    </span>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {!isControlled && (
          <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
        )}
        <DialogContent
          className="w-[380px]"
          onInteractOutside={(e) => { e.preventDefault() }}
        >
          <DialogHeader>
            <DialogTitle>{titleContent}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DrawerTrigger asChild>{trigger ?? defaultTrigger}</DrawerTrigger>
      )}
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{titleContent}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
          {formContent}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default ShopFormDialog
