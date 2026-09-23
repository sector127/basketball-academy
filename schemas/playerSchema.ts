import {z} from 'zod';

export const playerSchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .regex(/^[A-Za-z\s]+$/, "Name should only contain letters and spaces"),
    lastname: z.string()
        .min(1, "Last name is required")
        .regex(/^[A-Za-z\s]+$/, "Last name should only contain letters and spaces"),
    dateOfBirth: z.string()
        .min(1, "Date of birth is required")
        .refine((value) => new Date(value) < new Date(), "Date of birth must be in the past"),
    height: z.number()
        .min(100, "Height must be at least 100 cm")
        .max(250, "Height must be at most 250 cm"),
    position: z.string()
        .min(1, "Position is required")
        .regex(/^[A-Za-z\s]+$/, "Position should only contain letters and spaces"),
    jerseyNum: z.number()
        .min(1, "Jersey number must be at least 1")
        .max(99, "Jersey number must be at most 99"),
    teamId: z.string()
        .min(1, "Team is required"),
    tel: z.string()
        .min(1, "Phone number is required")
        .regex(/^\+?[0-9\s-]+$/, "Invalid phone number format"),
    address: z.string()
        .min(1, "Address is required")
        .regex(/^[A-Za-z0-9\s\-,.]+$/, "Invalid address format"),
    guardian: z.string()
        .min(1, "Guardian is required")
        .regex(/^[A-Za-z\s]+$/, "Guardian should only contain letters and spaces"),
    guardianTel: z.string()
        .min(1, "Guardian phone number is required")
        .regex(/^\+?[0-9\s-]+$/, "Invalid phone number format"),
});

export type PlayerFormData = z.infer<typeof playerSchema>;