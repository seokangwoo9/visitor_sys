"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, LogIn, LogOut, Printer, QrCode } from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";

const qrCodeCanvasSize = 240;
const qrCodeCornerRadius = 28;

interface VisitorQrCodeDefinition {
  id: "check-in" | "check-out";
  title: string;
  description: string;
  path: string;
  filename: string;
  printInstruction: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

interface GeneratedVisitorQrCode extends VisitorQrCodeDefinition {
  url: string;
  dataUrl: string;
  statusMessage: string;
}

const visitorQrCodeDefinitions: VisitorQrCodeDefinition[] = [
  {
    id: "check-in",
    title: "Check-in QR",
    description: "Print this code at the entrance for visitor registration.",
    path: "/check-in",
    filename: "toe-visitor-check-in-qr.png",
    printInstruction: "Scan to check in",
    icon: LogIn,
  },
  {
    id: "check-out",
    title: "Check-out QR",
    description: "Print this code at the exit for visitor check-out confirmation.",
    path: "/check-out",
    filename: "toe-visitor-check-out-qr.png",
    printInstruction: "Scan to check out",
    icon: LogOut,
  },
];

function getCssVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] ?? character;
  });
}

function createRoundedRectanglePath(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(width - radius, 0);
  context.quadraticCurveTo(width, 0, width, radius);
  context.lineTo(width, height - radius);
  context.quadraticCurveTo(width, height, width - radius, height);
  context.lineTo(radius, height);
  context.quadraticCurveTo(0, height, 0, height - radius);
  context.lineTo(0, radius);
  context.quadraticCurveTo(0, 0, radius, 0);
  context.closePath();
}

export function AdminQrCodeCard({
  preferredOrigin,
}: {
  preferredOrigin?: string;
}) {
  const canvasRefs = useRef<Record<VisitorQrCodeDefinition["id"], HTMLCanvasElement | null>>({
    "check-in": null,
    "check-out": null,
  });
  const [generatedQrCodes, setGeneratedQrCodes] = useState<
    Record<VisitorQrCodeDefinition["id"], GeneratedVisitorQrCode>
  >(() => createInitialQrCodeState());
  const [statusMessage, setStatusMessage] = useState("Preparing deployment URL...");

  useEffect(() => {
    async function generateQrCode(): Promise<void> {
      const darkColor = getCssVariable("--visitor-success-deep");
      const lightColor = getCssVariable("--bg-surface");

      if (!darkColor || !lightColor) {
        setStatusMessage("Unable to read QR styling tokens.");
        return;
      }

      const qrOptions = {
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: "M" as const,
        margin: 2,
        width: qrCodeCanvasSize,
      };

      const nextQrCodes = createInitialQrCodeState();
      const qrCodeOrigin = preferredOrigin ?? window.location.origin;

      for (const definition of visitorQrCodeDefinitions) {
        const url = new URL(definition.path, qrCodeOrigin).toString();
        const qrCanvas = document.createElement("canvas");
        const roundedQrCanvas = canvasRefs.current[definition.id];
        const roundedQrContext = roundedQrCanvas?.getContext("2d");

        if (!roundedQrCanvas || !roundedQrContext) {
          nextQrCodes[definition.id] = {
            ...definition,
            url,
            dataUrl: "",
            statusMessage: "Unable to prepare QR canvas.",
          };
          continue;
        }

        await QRCode.toCanvas(qrCanvas, url, qrOptions);

        roundedQrCanvas.width = qrCodeCanvasSize;
        roundedQrCanvas.height = qrCodeCanvasSize;
        roundedQrContext.clearRect(0, 0, qrCodeCanvasSize, qrCodeCanvasSize);
        roundedQrContext.save();
        createRoundedRectanglePath(
          roundedQrContext,
          qrCodeCanvasSize,
          qrCodeCanvasSize,
          qrCodeCornerRadius,
        );
        roundedQrContext.clip();
        roundedQrContext.drawImage(qrCanvas, 0, 0);
        roundedQrContext.restore();

        nextQrCodes[definition.id] = {
          ...definition,
          url,
          dataUrl: roundedQrCanvas.toDataURL("image/png"),
          statusMessage: preferredOrigin
            ? "QR code maps to this network address automatically."
            : "QR code maps to this deployment automatically.",
        };
      }

      setGeneratedQrCodes(nextQrCodes);
      setStatusMessage("Check-in and check-out QR codes are ready.");
    }

    void generateQrCode();
  }, [preferredOrigin]);

  function downloadQrCode(qrCode: GeneratedVisitorQrCode): void {
    if (!qrCode.dataUrl) {
      return;
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = qrCode.dataUrl;
    downloadLink.download = qrCode.filename;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  }

  function printQrCode(qrCode: GeneratedVisitorQrCode): void {
    if (!qrCode.dataUrl || !qrCode.url) {
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setStatusMessage("Allow pop-ups to print the QR code.");
      return;
    }

    const printableUrl = escapeHtml(qrCode.url);
    const printableTitle = escapeHtml(qrCode.title);
    const printableInstruction = escapeHtml(qrCode.printInstruction);

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>TOE Visitor ${printableTitle}</title>
    <style>
      body {
        align-items: center;
        display: flex;
        font-family: Arial, sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
      }

      main {
        text-align: center;
      }

      img {
        border-radius: 28px;
        height: 240px;
        width: 240px;
      }

      h1 {
        font-size: 22px;
        margin: 20px 0 8px;
      }

      p {
        font-size: 14px;
        margin: 0;
        word-break: break-all;
      }
    </style>
  </head>
  <body onload="window.focus(); window.print();">
    <main>
      <img alt="TOE Visitor ${printableTitle}" src="${qrCode.dataUrl}" />
      <h1>TOE Visitor Management System</h1>
      <p>${printableInstruction}</p>
      <p>${printableUrl}</p>
    </main>
  </body>
</html>`);
    printWindow.document.close();
    setStatusMessage("Print preview opened.");
  }

  return (
    <section className="rounded-[1.75rem] border border-visitor-success/10 bg-admin-panel p-6 shadow-xl shadow-admin-shadow/10">
      <div className="flex items-start gap-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-visitor-success-soft text-visitor-success-deep">
          <QrCode className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
            Visitor QR Code
          </p>
          <h2 className="mt-3 text-2xl font-bold text-visitor-ink">
            Check-in and Check-out QR
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Print separate codes for the entrance and exit. Localhost URLs are converted to the internal network address.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {visitorQrCodeDefinitions.map((definition) => {
          const qrCode = generatedQrCodes[definition.id];

          return (
            <QrCodePanel
              key={definition.id}
              qrCode={qrCode}
              refCallback={(canvas) => {
                canvasRefs.current[definition.id] = canvas;
              }}
              onDownload={() => downloadQrCode(qrCode)}
              onPrint={() => printQrCode(qrCode)}
            />
          );
        })}
      </div>

      <p className="mt-5 text-xs font-semibold text-text-muted">
        {statusMessage}
      </p>
    </section>
  );
}

function createInitialQrCodeState(): Record<VisitorQrCodeDefinition["id"], GeneratedVisitorQrCode> {
  return visitorQrCodeDefinitions.reduce(
    (state, definition) => ({
      ...state,
      [definition.id]: {
        ...definition,
        url: "",
        dataUrl: "",
        statusMessage: "Resolving deployment URL...",
      },
    }),
    {} as Record<VisitorQrCodeDefinition["id"], GeneratedVisitorQrCode>,
  );
}

interface QrCodePanelProps {
  qrCode: GeneratedVisitorQrCode;
  refCallback: (canvas: HTMLCanvasElement | null) => void;
  onDownload: () => void;
  onPrint: () => void;
}

function QrCodePanel({
  qrCode,
  refCallback,
  onDownload,
  onPrint,
}: QrCodePanelProps) {
  const Icon = qrCode.icon;

  return (
    <div className="rounded-3xl bg-card p-5">
      <div className="flex items-start gap-3 text-left">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-visitor-success-soft text-visitor-success-deep">
          <Icon className="size-5" aria-hidden={true} />
        </span>
        <div>
          <h3 className="text-lg font-bold text-visitor-ink">{qrCode.title}</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {qrCode.description}
          </p>
        </div>
      </div>

      <canvas
        aria-label={`Visitor ${qrCode.title}`}
        className="mx-auto mt-5 size-[240px] rounded-2xl bg-card"
        height={qrCodeCanvasSize}
        ref={refCallback}
        width={qrCodeCanvasSize}
      />
      <p className="mt-4 break-all text-sm font-semibold leading-6 text-text-primary">
        {qrCode.url || "Resolving deployment URL..."}
      </p>
      <p className="mt-2 text-xs font-semibold text-text-muted">
        {qrCode.statusMessage}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          className="h-12 rounded-2xl bg-visitor-success px-5 font-bold text-primary-foreground shadow-lg shadow-visitor-success/20 hover:bg-visitor-success-deep"
          disabled={!qrCode.dataUrl}
          onClick={onDownload}
          type="button"
        >
          <Download className="size-4" aria-hidden="true" />
          Download PNG
        </Button>
        <Button
          className="h-12 rounded-2xl border-border bg-card px-5 font-bold text-text-primary hover:bg-visitor-success-soft hover:text-visitor-success-deep"
          disabled={!qrCode.dataUrl}
          onClick={onPrint}
          type="button"
          variant="outline"
        >
          <Printer className="size-4" aria-hidden="true" />
          Print QR
        </Button>
      </div>
    </div>
  );
}
