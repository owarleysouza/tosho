import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { useVisualViewportInset } from "@/hooks/useVisualViewportInset"

const Drawer = ({
  shouldScaleBackground = true,
  // vaul's own keyboard handling grows the drawer's DOM height to fill the
  // visual viewport whenever a focused input is inside it, regardless of
  // how tall the content actually is — on a short form (e.g. ProductEditDialog's
  // "Editar item") that leaves a large blank strip of the drawer's background
  // below the fields once the keyboard opens. Disabled in favor of the same
  // visualViewport-based cap/shift sheet.tsx already uses, which sizes the
  // panel to its content and scrolls instead of stretching it.
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    repositionInputs={repositionInputs}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, style, ...props }, ref) => {
  // Same fixed-to-bottom-of-layout-viewport problem sheet.tsx solves for:
  // shift the panel up by whatever the keyboard is obscuring and cap its
  // height to what's actually visible, scrolling internally past that.
  const keyboardInset = useVisualViewportInset()

  // The field is usually already focused (and thus already scrolled to,
  // by whatever brought the user here) *before* the keyboard finishes
  // opening and this panel shrinks around it — the browser has no reason
  // to re-scroll on its own afterwards, so a field near the bottom of the
  // form (e.g. ProductEditDialog's "Descrição") is left clipped below the
  // now-shorter panel with nothing to reveal it. Do that scroll ourselves
  // whenever the obscured amount changes.
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (keyboardInset) {
      const active = document.activeElement
      if (active instanceof HTMLElement && contentRef.current?.contains(active)) {
        active.scrollIntoView({ block: "nearest" })
      }
      // Keyboard closed again (blur, submit, dismiss) — nothing scrolls
      // the panel back on its own, so it's left stranded wherever the
      // keyboard-open scroll last left it, header and all cut off above.
    } else if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [keyboardInset])

  // A new inline ref callback on every render (e.g. from react-hook-form
  // re-rendering on each keystroke) makes React detach-then-reattach the
  // DOM ref every time — vaul's outside-click/focus detection reads that
  // ref, and finding it momentarily null while focus moves between two
  // fields was enough to look like "focus left the drawer" and close it.
  // useCallback keeps the function identity stable across re-renders.
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    },
    [ref]
  )

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={setRefs}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[96dvh] flex-col overflow-y-auto rounded-t-[10px] border bg-background",
          className
        )}
        style={{
          // transform instead of `bottom` — iOS Safari is known to lag or
          // skip repainting `position: fixed` elements repositioned via a
          // layout property (top/bottom/height) during the keyboard's
          // show/hide animation, leaving the panel visually stuck at its
          // pre-keyboard position (the "blank strip" the bottom-anchored
          // box leaves behind). A transform is compositor-only and tracks
          // the visualViewport resize events immediately.
          transform: keyboardInset ? `translateY(-${keyboardInset}px)` : undefined,
          maxHeight: `calc(96dvh - ${keyboardInset}px)`,
          ...style,
        }}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
