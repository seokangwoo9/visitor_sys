"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";

const qrCodeCanvasSize = 240;
const qrCodeCornerRadius = 28;

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

export function AdminQrCodeCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("Preparing deployment URL...");

  useEffect(() => {
    async function generateQrCode(): Promise<void> {
      const nextRegistrationUrl = new URL("/", window.location.origin).toString();
      const darkColor = getCssVariable("--visitor-success-deep");
      const lightColor = getCssVariable("--bg-surface");

      if (!canvasRef.current || !darkColor || !lightColor) {
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
      const qrCanvas = document.createElement("canvas");
      const roundedQrCanvas = canvasRef.current;
      const roundedQrContext = roundedQrCanvas.getContext("2d");

      if (!roundedQrContext) {
        setStatusMessage("Unable to prepare QR canvas.");
        return;
      }

      await QRCode.toCanvas(qrCanvas, nextRegistrationUrl, qrOptions);

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

      setRegistrationUrl(nextRegistrationUrl);
      setQrCodeDataUrl(roundedQrCanvas.toDataURL("image/png"));
      setStatusMessage("QR code maps to this deployment automatically.");
    }

    void generateQrCode();
  }, []);

  function downloadQrCode(): void {
    if (!qrCodeDataUrl) {
      return;
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = qrCodeDataUrl;
    downloadLink.download = "toe-visitor-registration-qr.png";
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  }

  function printQrCode(): void {
    if (!qrCodeDataUrl || !registrationUrl) {
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setStatusMessage("Allow pop-ups to print the QR code.");
      return;
    }

    const printableUrl = escapeHtml(registrationUrl);

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>TOE Visitor Registration QR</title>
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
      <img alt="TOE Visitor registration QR code" src="${qrCodeDataUrl}" />
      <h1>TOE Visitor Management System</h1>
      <p>Scan to register your visit</p>
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
            Registration QR
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Print this code for visitors. It always points to the registration page for the current deployment.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-card p-5 text-center">
        <canvas
          aria-label="Visitor registration QR code"
          className="mx-auto size-[240px] rounded-2xl bg-card"
          height={qrCodeCanvasSize}
          ref={canvasRef}
          width={qrCodeCanvasSize}
        />
        <p className="mt-4 break-all text-sm font-semibold leading-6 text-text-primary">
          {registrationUrl || "Resolving deployment URL..."}
        </p>
        <p className="mt-2 text-xs font-semibold text-text-muted">
          {statusMessage}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          className="h-12 rounded-2xl bg-visitor-success px-5 font-bold text-primary-foreground shadow-lg shadow-visitor-success/20 hover:bg-visitor-success-deep"
          disabled={!qrCodeDataUrl}
          onClick={downloadQrCode}
          type="button"
        >
          <Download className="size-4" aria-hidden="true" />
          Download PNG
        </Button>
        <Button
          className="h-12 rounded-2xl border-border bg-card px-5 font-bold text-text-primary hover:bg-visitor-success-soft hover:text-visitor-success-deep"
          disabled={!qrCodeDataUrl}
          onClick={printQrCode}
          type="button"
          variant="outline"
        >
          <Printer className="size-4" aria-hidden="true" />
          Print QR
        </Button>
      </div>
    </section>
  );
}
