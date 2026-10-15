import {z} from 'zod';

// Must match the Player model: spaces, dashes, dots and parentheses are stripped,
// then an international number ("+" and 7-15 digits) is required
const phoneNumber = (requiredMessage: string) => z.string()
    .min(1, requiredMessage)
    .refine(
        (value) => /^\+\d{7,15}$/.test(value.replace(/[\s\-().]/g, '')),
        "Use international format, e.g. +995 599 00 00 00"
    );

export const playerSchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .regex(/^[\p{L}\s'-]+$/u, "Name should only contain letters, hyphens, and spaces"),
    lastname: z.string()
        .min(1, "Last name is required")
        .regex(/^[\p{L}\s'-]+$/u, "Last name should only contain letters, hyphens, and spaces"),
    dateOfBirth: z.string()
        .min(1, "Date of birth is required")
        .refine((value) => new Date(value) < new Date(), "Date of birth must be in the past"),
    height: z.coerce.number()
        .min(80, "Height must be at least 80 cm")
        .max(250, "Height must be at most 250 cm"),
    // A string (not an enum) so the form can start with nothing selected
    position: z.string().refine(
        (value) => ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'].includes(value),
        "Position is required"
    ),
    jerseyNum: z.coerce.number()
        .min(0, "Jersey number must be between 0 and 99")
        .max(99, "Jersey number must be between 0 and 99"),
    teamId: z.string()
        .min(1, "Team is required"),
    tel: phoneNumber("Phone number is required"),
    address: z.string()
        .min(1, "Address is required")
        .regex(/^[\p{L}\p{N}\s\-,./#]+$/u, "Invalid address format"),
    guardian: z.enum(['Mother', 'Father', 'Other'], {errorMap: () => ({message: "Guardian is required"})}),
    guardianTel: phoneNumber("Guardian phone number is required"),
});

export type PlayerFormData = z.infer<typeof playerSchema>;