import { shadcn } from "@clerk/themes";

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl:
      typeof window !== "undefined"
        ? `${window.location.origin}${basePath}/logo.svg`
        : `${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(187 96% 50%)",
    colorForeground: "hsl(210 40% 98%)",
    colorMutedForeground: "hsl(215 18% 64%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(222 47% 6%)",
    colorInput: "hsl(217 30% 12%)",
    colorInputForeground: "hsl(210 40% 98%)",
    colorNeutral: "hsl(217 30% 18%)",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[hsl(222_47%_6%)] border border-[hsl(217_30%_14%)] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer:
      "!shadow-none !border-0 !bg-transparent !rounded-none border-t border-[hsl(217_30%_14%)]/60",
    headerTitle: "text-[hsl(210_40%_98%)] text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-[hsl(215_18%_64%)] text-sm",
    socialButtonsBlockButtonText: "text-[hsl(210_40%_98%)] font-medium",
    formFieldLabel: "text-[hsl(210_40%_98%)] text-sm font-medium",
    footerActionLink: "text-[hsl(187_96%_50%)] hover:opacity-80 font-medium",
    footerActionText: "text-[hsl(215_18%_64%)]",
    dividerText: "text-[hsl(215_18%_64%)] uppercase tracking-wider text-xs",
    identityPreviewEditButton: "text-[hsl(187_96%_50%)]",
    formFieldSuccessText: "text-[hsl(152_76%_50%)]",
    alertText: "text-[hsl(210_40%_98%)]",
    logoBox: "mb-2",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton:
      "border border-[hsl(217_30%_18%)] bg-[hsl(217_30%_10%)] hover:bg-[hsl(217_30%_14%)]",
    formButtonPrimary:
      "bg-[hsl(187_96%_50%)] text-[hsl(222_47%_6%)] hover:opacity-90 font-semibold",
    formFieldInput:
      "bg-[hsl(217_30%_10%)] border border-[hsl(217_30%_18%)] text-[hsl(210_40%_98%)]",
    footerAction: "py-3",
    dividerLine: "bg-[hsl(217_30%_14%)]",
    alert: "border border-[hsl(0_84%_60%)]/40 bg-[hsl(0_84%_60%)]/10",
    otpCodeFieldInput:
      "bg-[hsl(217_30%_10%)] border border-[hsl(217_30%_18%)] text-[hsl(210_40%_98%)]",
    formFieldRow: "gap-1.5",
    main: "gap-5",
  },
};
