import "dotenv/config";
import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";

import { prisma } from "@/lib/prisma";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function main(): Promise<void> {
  const name = getRequiredEnv("ADMIN_SEED_NAME");
  const email = getRequiredEnv("ADMIN_SEED_EMAIL").toLowerCase();
  const password = getRequiredEnv("ADMIN_SEED_PASSWORD");

  const existingUser = await prisma.users.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    console.info(`Admin auth user already exists for ${email}.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (transaction) => {
    const userId = randomUUID();

    const user = await transaction.users.create({
      data: {
        id: userId,
        name,
        email,
        emailVerified: true,
      },
    });

    await transaction.accounts.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
  });

  console.info(`Seeded admin auth user for ${email}.`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
