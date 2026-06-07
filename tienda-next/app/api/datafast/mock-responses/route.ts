import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Mock responses de Datafast (Peach Payments / HiPay) para la fase 2 de integración.
 * Basados en la documentación oficial de Datafast.
 */

// Mock response para /iniciar-pago (checkout creation)
const mockCheckoutSuccess = {
  id: "8AC7A2EBFFC0A45D3E251A76D8F477C9.uat01-vm-tx01",
  timestamp: "2026-06-04T15:30:45Z",
  ndc: "8a829418533cf31d01533d06f2ee06fa",
  result: {
    code: "000.200.100",
    description: "Successfully created checkout",
  },
  buildNumber: "95df1c0bda4798f32f372d07ef03046061075688@2024-06-04 14:25:15 +0000",
  timestamp: "2026-06-04 15:30:45+0000",
  ndc: "8a829418533cf31d01533d06f2ee06fa",
};

// Mock response para pago exitoso
const mockPaymentSuccess = {
  id: "8AC7A2EBFFC0A45D3E251A76D8F477C9",
  paymentType: "DB",
  paymentBrand: "VISA",
  amount: "27.00",
  currency: "USD",
  descriptor: "MARCA ESTILO - Orden #123",
  merchantTransactionId: "abc123xyz",
  result: {
    code: "000.100.110",
    description: "Request successfully processed in 'Merchant in Integrator Test Mode'",
  },
  card: {
    bin: "411111",
    last4Digits: "1111",
    expiryMonth: "12",
    expiryYear: "2026",
    holder: "Juan Perez",
    type: "DEBIT",
  },
  customer: {
    ip: "192.168.1.1",
  },
  risk: {
    score: "100",
    result: "APPROVED",
  },
  timestamp: "2026-06-04 15:35:20+0000",
  ndc: "8a829418533cf31d01533d06f2ee06fa",
  buildNumber: "95df1c0bda4798f32f372d07ef03046061075688@2024-06-04 14:25:15 +0000",
};

// Mock response para pago pendiente
const mockPaymentPending = {
  id: "8AC7A2EBFFC0A45D3E251A76D8F477C9",
  paymentType: "DB",
  paymentBrand: "VISA",
  amount: "27.00",
  currency: "USD",
  descriptor: "MARCA ESTILO - Orden #123",
  merchantTransactionId: "abc123xyz",
  result: {
    code: "000.200.000",
    description: "Transaction pending - waiting for user input",
  },
  timestamp: "2026-06-04 15:35:20+0000",
  ndc: "8a829418533cf31d01533d06f2ee06fa",
  buildNumber: "95df1c0bda4798f32f372d07ef03046061075688@2024-06-04 14:25:15 +0000",
};

// Mock response para pago fallido
const mockPaymentFailed = {
  id: "8AC7A2EBFFC0A45D3E251A76D8F477C9",
  paymentType: "DB",
  paymentBrand: "VISA",
  amount: "27.00",
  currency: "USD",
  descriptor: "MARCA ESTILO - Orden #123",
  merchantTransactionId: "abc123xyz",
  result: {
    code: "200.300.404",
    description: "Invalid credit card number",
  },
  timestamp: "2026-06-04 15:35:20+0000",
  ndc: "8a829418533cf31d01533d06f2ee06fa",
  buildNumber: "95df1c0bda4798f32f372d07ef03046061075688@2024-06-04 14:25:15 +0000",
};

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  let response;
  switch (type) {
    case "checkout":
      response = mockCheckoutSuccess;
      break;
    case "success":
      response = mockPaymentSuccess;
      break;
    case "pending":
      response = mockPaymentPending;
      break;
    case "failed":
      response = mockPaymentFailed;
      break;
    default:
      response = {
        message: "Datafast Mock Responses",
        endpoints: [
          { type: "checkout", description: "Mock respuesta de creación de checkout" },
          { type: "success", description: "Mock respuesta de pago exitoso" },
          { type: "pending", description: "Mock respuesta de pago pendiente" },
          { type: "failed", description: "Mock respuesta de pago fallido" },
        ],
        examples: {
          checkout: mockCheckoutSuccess,
          success: mockPaymentSuccess,
          pending: mockPaymentPending,
          failed: mockPaymentFailed,
        },
      };
  }

  console.log("📄 [datafast/mock-responses] Returning mock type:", type);

  return NextResponse.json(response);
}
