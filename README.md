This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Notion Storage

The Invisible Host form stores submissions in the Notion database `Data from Chatbot`.
The Begin Your Story / Comienza Tu Historia form stores submissions in Supabase when configured, and can also continue saving to Notion database `Data from solicitation`.

Create `.env.local` in the project root:

```bash
NOTION_TOKEN=secret_your_notion_integration_token
NOTION_CHATBOT_DATA_SOURCE_ID=ea99b3b1-c1dc-470b-8e63-e593e0be2152
NOTION_SOLICITATION_DATA_SOURCE_ID=886c3c75-4622-493e-83a7-d3af9a551edf
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="Tu dia de blanco <hello@your-domain.com>"
RESEND_REPLY_TO=hello@your-domain.com
RESEND_INTERNAL_EMAIL=contacto@tudiadeblanco.com
```

Share both Notion databases with the Notion integration and make sure the integration has insert content permissions.

Run `supabase/migrations/001_solicitation_schema.sql` in Supabase to create the related solicitation tables and the `solicitation-images` storage bucket.

## Resend Email Templates

The app sends confirmation emails after:

- completing the Begin Your Story / Comienza Tu Historia form
- trying the Invisible Host chatbot

Create or update the Resend templates from `lib/resendTemplates.json`:

```bash
npm run resend:templates
```

This publishes two aliases in Resend:

- `tu-dia-de-blanco-form-confirmation`
- `tu-dia-de-blanco-chatbot-confirmation`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
