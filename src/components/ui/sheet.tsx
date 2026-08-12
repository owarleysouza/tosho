import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useVisualViewportInset } from "@/hooks/useVisualViewportInset"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, style, ...props }, ref) => {
  // Bottom sheets are the ones that get covered by the on-screen mobile
  // keyboard: fixed to `bottom: 0` of the layout viewport, which doesn't
  // shrink when the keyboard opens — only the visual viewport does. Shift
  // the panel up by exactly the obscured amount and cap its height to
  // what's actually visible, so a focused input inside (e.g. HU-07/HU-23's
  // free-text textarea) never ends up hidden behind the keyboard. Called
  // unconditionally (Rules of Hooks) — the result is simply unused for
  // every other side, and on desktop it's always 0 anyway.
  const keyboardInset = useVisualViewportInset()

  // Same as drawer.tsx's DrawerContent: the field is usually already
  // focused before the keyboard finishes opening and this panel shrinks
  // around it, so the browser has no reason to re-scroll on its own
  // afterwards — do it ourselves whenever the obscured amount changes.
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (keyboardInset) {
      const active = document.activeElement
      if (active instanceof HTMLElement && contentRef.current?.contains(active)) {
        active.scrollIntoView({ block: "nearest" })
      }
      // Keyboard closed again — nothing scrolls the panel back on its
      // own, so it's left stranded wherever the keyboard-open scroll
      // last left it.
    } else if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [keyboardInset])

  // See drawer.tsx's DrawerContent for why this is useCallback and not an
  // inline arrow function: an unstable ref identity makes React detach and
  // reattach the DOM ref on every re-render, which was enough to make
  // Radix's outside-click detection see focus moving between two fields
  // as "left the sheet" and close it.
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    },
    [ref]
  )

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={setRefs}
        className={cn(
          sheetVariants({ side }),
          side === "bottom" && "w-full max-w-full overflow-x-hidden overflow-y-auto",
          className
        )}
        style={
          side === "bottom"
            ? {
                // transform, not `bottom` — see drawer.tsx's DrawerContent
                // for why: iOS Safari can lag repainting a `position: fixed`
                // element repositioned via a layout property during the
                // keyboard's show/hide animation, but a transform is
                // compositor-only and tracks visualViewport resizes immediately.
                transform: keyboardInset ? `translateY(-${keyboardInset}px)` : undefined,
                maxHeight: `calc(100dvh - ${keyboardInset}px)`,
                ...style,
              }
            : style
        }
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
