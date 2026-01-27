"use client"

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react"

export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: false,
  duration: 3000,
})

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root 
            width={{ base: "full", md: "md" }}
            bg={toast.type === "success" ? "rgba(34, 197, 94, 0.15)" : toast.type === "error" ? "rgba(239, 68, 68, 0.15)" : "#1a1a2e"}
            borderWidth="1px"
            borderColor={toast.type === "success" ? "green.500/50" : toast.type === "error" ? "red.500/50" : "whiteAlpha.200"}
            borderRadius="xl"
            p="4"
            shadow="0 10px 40px rgba(0, 0, 0, 0.5)"
          >
            {toast.type === "loading" ? (
              <Spinner size="md" color="purple.400" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && (
                <Toast.Title 
                  fontSize="md" 
                  fontWeight="semibold" 
                  color={toast.type === "success" ? "green.300" : toast.type === "error" ? "red.300" : "white"}
                >
                  {toast.title}
                </Toast.Title>
              )}
              {toast.description && (
                <Toast.Description fontSize="sm" color="whiteAlpha.700">
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
