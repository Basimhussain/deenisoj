import { z } from 'zod';

export const questionSchema = z.object({
  name: z.string().max(120).optional().or(z.literal('')),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z.string().max(40).optional().or(z.literal('')),
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(5000, 'Question is too long'),
  isAnonymous: z.boolean().default(false),
  allowPublic: z.boolean().default(true),
});

export type QuestionInput = z.infer<typeof questionSchema>;

export type QuestionStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'answered'
  | 'rejected';

export const STATUS_COLORS: Record<QuestionStatus, string> = {
  submitted: '#3b82f6',
  under_review: '#eab308',
  in_progress: '#f97316',
  answered: '#22c55e',
  rejected: '#ef4444',
};

export const STATUS_LABELS: Record<QuestionStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  answered: 'Answered',
  rejected: 'Rejected',
};

export type ScholarDecision = 'approved' | 'denied' | 'revised';

export const scholarReviewCreateSchema = z.object({
  question_id: z.string().uuid(),
  proposed_question: z.string().min(10).max(5000),
  proposed_answer: z.string().min(20).max(20000),
});

export const scholarReviewResponseSchema = z
  .object({
    decision: z.enum(['approved', 'denied', 'revised']),
    scholar_name: z
      .string()
      .min(2, 'Please enter your name')
      .max(120),
    revised_answer: z.string().max(20000).optional().or(z.literal('')),
    comments: z.string().max(5000).optional().or(z.literal('')),
  })
  .refine(
    (v) =>
      v.decision !== 'revised' ||
      (v.revised_answer && v.revised_answer.trim().length >= 20),
    {
      message: 'Please provide a revised answer (at least 20 characters).',
      path: ['revised_answer'],
    }
  );

export type ScholarReviewResponseInput = z.infer<
  typeof scholarReviewResponseSchema
>;
