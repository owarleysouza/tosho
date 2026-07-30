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
import { FilePlus2, LayoutTemplate, History, Loader2 } from "lucide-react"

import { useForm } from "react-hook-form"
import { ShopCreateFormSchema, ShopStartingPointEnum } from "@/utils/formValidations"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { collection, addDoc, doc, getDocs, query, serverTimestamp, updateDoc, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"
import { addProductsToShop } from "@/utils/addProductsToShop"

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

// RN-29 will wire "template" up; "previous" (HU-20) is enabled based on
// whether a completed purchase actually exists to clone from.
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

  // react-hook-form only applies defaultValues once, at mount — since this
  // component (and its underlying Dialog/Drawer) stays mounted between opens,
  // re-sync the form to the current shop every time it opens instead of
  // showing whatever was there the first time.
  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(shop))
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

  const disabledMap: Record<z.infer<typeof ShopStartingPointEnum>, boolean> = {
    scratch: false,
    template: true, // RN-29 — not built yet
    previous: completedShops.length === 0,
  }

  const onSubmit = async (data: z.infer<typeof ShopCreateFormSchema>): Promise<void> => {
    // "template" is still disabled in the UI (RN-29), so this branch can't
    // be reached with it selected — only "scratch" and "previous" (HU-20)
    // are actually reachable here.
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

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
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
                      // "Em breve" (not built) vs. a precondition simply
                      // not met yet (RN-29 vs. HU-20) — different reasons,
                      // shouldn't share the same label.
                      const disabledLabel =
                        option.value === "template"
                          ? "Em breve"
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

        <Button disabled={loading} type="submit" className='w-full rounded-full'>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isEditMode ? "Salvar alterações" : "Criar compra"}
        </Button>
      </form>
    </Form>
  )

  const title = isEditMode ? "Editar compra" : "Nova compra"
  const description = isEditMode
    ? "Atualize o nome ou a data/hora da compra."
    : "Adicione uma compra a ser realizada."

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
            <DialogTitle>{title}</DialogTitle>
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
          <DrawerTitle>{title}</DrawerTitle>
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
