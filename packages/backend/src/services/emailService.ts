import type { ContactInquiry, FormSubmission, FormTemplate } from '@prisma/client';
import sgMail, { type MailDataRequired } from '@sendgrid/mail';

import { env } from '../config/env';
import { logger } from '../lib/logger';

type SendResult = { sent: boolean; skipped?: boolean; error?: string };

const initSendGrid = (): boolean => {
  if (!env.sendgridApiKey) {
    logger.warn('SendGrid API key missing; email disabled');
    return false;
  }

  sgMail.setApiKey(env.sendgridApiKey);
  return true;
};

const sendEmail = async (
  message: MailDataRequired
): Promise<SendResult> => {
  if (!env.emailEnabled || env.nodeEnv === 'test') {
    logger.info('Email sending skipped (disabled or test env)', {
      to: message.to,
      subject: message.subject,
    });
    return { sent: false, skipped: true };
  }

  if (!initSendGrid()) {
    return { sent: false, skipped: true, error: 'missing_api_key' };
  }

  try {
    await sgMail.send(message);
    return { sent: true };
  } catch (error) {
    logger.error('Failed to send email', {
      to: message.to,
      subject: message.subject,
      error,
    });
    return { sent: false, error: 'send_failed' };
  }
};

const buildVisitorMessage = (
  inquiry: ContactInquiry
): MailDataRequired => {
  return {
    to: inquiry.email,
    from: env.sendgridFromEmail,
    replyTo: env.sendgridReplyTo ?? env.sendgridFromEmail,
    subject: 'We received your inquiry',
    text: [
      `Hi ${inquiry.fullName},`,
      '',
      'Thanks for reaching out to Adria Cross. We received your inquiry and will respond soon.',
      '',
      'Summary:',
      `- Service interest: ${inquiry.serviceInterest ?? 'General inquiry'}`,
      `- Submitted: ${inquiry.createdAt.toISOString()}`,
      '',
      'If you need to add anything else, just reply to this email.',
      '',
      '— Adria Cross Team',
    ].join('\n'),
    html: `
      <p>Hi ${inquiry.fullName},</p>
      <p>Thanks for reaching out to Adria Cross. We received your inquiry and will respond soon.</p>
      <p><strong>Summary</strong><br/>
      Service interest: ${inquiry.serviceInterest ?? 'General inquiry'}<br/>
      Submitted: ${inquiry.createdAt.toISOString()}</p>
      <p>If you need to add anything else, just reply to this email.</p>
      <p>— Adria Cross Team</p>
    `,
  };
};

const buildAdminNotification = (
  inquiry: ContactInquiry
): MailDataRequired => {
  return {
    to: env.sendgridAdminEmail,
    from: env.sendgridFromEmail,
    subject: `New inquiry from ${inquiry.fullName}`,
    text: [
      `New inquiry received:`,
      `Name: ${inquiry.fullName}`,
      `Email: ${inquiry.email}`,
      `Phone: ${inquiry.phone ?? 'N/A'}`,
      `Service interest: ${inquiry.serviceInterest ?? 'General inquiry'}`,
      '',
      `Message:`,
      inquiry.message,
      '',
      `View in admin: ${env.adminDashboardUrl}`,
    ].join('\n'),
    html: `
      <p>New inquiry received:</p>
      <ul>
        <li><strong>Name:</strong> ${inquiry.fullName}</li>
        <li><strong>Email:</strong> ${inquiry.email}</li>
        <li><strong>Phone:</strong> ${inquiry.phone ?? 'N/A'}</li>
        <li><strong>Service interest:</strong> ${
          inquiry.serviceInterest ?? 'General inquiry'
        }</li>
      </ul>
      <p><strong>Message:</strong><br/>${inquiry.message}</p>
      <p><a href="${env.adminDashboardUrl}">View in admin</a></p>
    `,
  };
};

export async function sendInquiryNotifications(inquiry: ContactInquiry) {
  const visitor = await sendEmail(buildVisitorMessage(inquiry));
  const admin = await sendEmail(buildAdminNotification(inquiry));

  return {
    visitor,
    admin,
  };
}

const buildFormVisitorMessage = (
  submission: FormSubmission,
  template: Pick<FormTemplate, 'name' | 'id'>,
  summary: string
): MailDataRequired => {
  return {
    to: submission.email ?? env.sendgridAdminEmail,
    from: env.sendgridFromEmail,
    replyTo: env.sendgridReplyTo ?? env.sendgridFromEmail,
    subject: `We received your "${template.name}" form`,
    text: [
      'Thanks for sharing details with Adria Cross.',
      `Form: ${template.name}`,
      '',
      'What you sent:',
      summary,
      '',
      'We will follow up soon with next steps.',
      '— Adria Cross Team',
    ].join('\n'),
    html: `
      <p>Thanks for sharing details with Adria Cross.</p>
      <p><strong>Form:</strong> ${template.name}</p>
      <p><strong>What you sent:</strong><br/>${summary.replace(/\n/g, '<br/>')}</p>
      <p>We will follow up soon with next steps.</p>
      <p>— Adria Cross Team</p>
    `,
  };
};

const buildFormAdminNotification = (
  submission: FormSubmission,
  template: FormTemplate,
  summary: string
): MailDataRequired => {
  return {
    to: env.sendgridAdminEmail,
    from: env.sendgridFromEmail,
    subject: `New submission for ${template.name}`,
    text: [
      `Template: ${template.name}`,
      `Template ID: ${template.id}`,
      `Submission: ${submission.id}`,
      '',
      'Responses:',
      summary,
      '',
      `View in admin: ${env.adminFormsUrl}`,
    ].join('\n'),
    html: `
      <p><strong>Template:</strong> ${template.name}</p>
      <p><strong>Submission:</strong> ${submission.id}</p>
      <p><strong>Responses:</strong><br/>${summary.replace(/\n/g, '<br/>')}</p>
      <p><a href="${env.adminFormsUrl}">View in admin</a></p>
    `,
  };
};

const summarizeResponses = (
  submission: FormSubmission,
  template: FormTemplate
): string => {
  const labelMap = Object.fromEntries(
    (template.fields as unknown[] as { id: string; label?: string }[]).map(
      (field) => [field.id, field.label ?? field.id]
    )
  );

  return Object.entries(submission.responses as Record<string, unknown>)
    .slice(0, 12)
    .map(([key, value]) => {
      const label = labelMap[key] ?? key;
      if (Array.isArray(value)) {
        return `- ${label}: ${value.join(', ')}`;
      }
      return `- ${label}: ${String(value)}`;
    })
    .join('\n');
};

export async function sendFormSubmissionNotifications(
  submission: FormSubmission,
  template: FormTemplate
) {
  const summary = summarizeResponses(submission, template);

  const visitor =
    submission.email && submission.email.length > 0
      ? await sendEmail(
          buildFormVisitorMessage(submission, template, summary)
        )
      : { sent: false, skipped: true as const };

  const admin = await sendEmail(
    buildFormAdminNotification(submission, template, summary)
  );

  return { visitor, admin };
}
