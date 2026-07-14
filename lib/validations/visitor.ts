import { z } from "zod";

const requiredText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required.`)
    .max(maxLength, `${fieldName} must be ${maxLength} characters or fewer.`);

export const visitorRegistrationSchema = z.object({
  fullName: requiredText("Name", 200),
  identificationNumber: requiredText("IC / ID number", 100),
  companyName: requiredText("Company name", 200),
  contactNumber: requiredText("Contact number", 50),
  partySize: z.coerce
    .number()
    .int("Number of people must be a whole number.")
    .min(1, "Number of people must be at least 1.")
    .max(100, "Number of people must be 100 or fewer."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(320, "Email must be 320 characters or fewer."),
  hasVehicle: z.boolean(),
  vehiclePlateNumber: z
    .string()
    .trim()
    .max(50, "Vehicle plate number must be 50 characters or fewer."),
  department: z
    .string()
    .trim()
    .max(200, "Department must be 200 characters or fewer.")
    .optional(),
  hostName: requiredText("Person to meet / PIC", 200),
  purposeOfVisit: requiredText("Purpose of visit", 1000),
  safetyAcknowledged: z.boolean().refine((value) => value, {
    message: "Safety acknowledgment is required before check in.",
  }),
  safetyAcknowledgmentVersionId: z.uuid("Safety acknowledgment version is required."),
}).superRefine((value, context) => {
  if (value.hasVehicle && value.vehiclePlateNumber.length === 0) {
    context.addIssue({
      code: "custom",
      message: "Vehicle plate number is required.",
      path: ["vehiclePlateNumber"],
    });
  }
});

export const visitorCheckoutSearchSchema = z.object({
  contactNumber: requiredText("Contact number", 50),
});

export type VisitorRegistrationFormInput = z.input<typeof visitorRegistrationSchema>;
export type VisitorRegistrationSchema = z.infer<typeof visitorRegistrationSchema>;
export type VisitorCheckoutSearchSchema = z.infer<typeof visitorCheckoutSearchSchema>;
