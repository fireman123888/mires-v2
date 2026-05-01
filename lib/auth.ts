import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "https://mires.top",
  secret: process.env.BETTER_AUTH_SECRET || "fallback-only-for-build-time",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      credits: {
        type: "number",
        required: false,
        defaultValue: 200,
      },
      proPlanType: {
        type: "string",
        required: false,
      },
      proPlanExpiresAt: {
        type: "date",
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      if (!resend) {
        console.log(`\n[RESET PASSWORD for ${user.email}]\n${url}\n`);
        return;
      }
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Mires <onboarding@resend.dev>",
        to: user.email,
        subject: "重置你的 Mires 密码",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#111">
            <h2 style="margin:0 0 16px;font-weight:800">重置你的 Mires 密码</h2>
            <p style="margin:0 0 24px;color:#555;line-height:1.6">点击下方按钮设置新密码。链接 1 小时内有效。</p>
            <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#FE2C55;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">重置密码</a></p>
            <p style="margin-top:32px;color:#888;font-size:12px;line-height:1.6">如果按钮无法点击，复制此链接到浏览器：<br><span style="word-break:break-all">${url}</span></p>
            <p style="margin-top:24px;color:#aaa;font-size:12px">如果不是你本人发起的，请忽略此邮件，密码不会变化。</p>
          </div>
        `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (!resend) {
        console.log(`\n[VERIFY EMAIL for ${user.email}]\n${url}\n`);
        return;
      }
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Mires <onboarding@resend.dev>",
        to: user.email,
        subject: "验证你的 Mires 邮箱",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#111">
            <h2 style="margin:0 0 16px;font-weight:800">验证你的 Mires 邮箱</h2>
            <p style="margin:0 0 24px;color:#555;line-height:1.6">点击下方按钮完成邮箱验证，验证后即可使用密码登录。链接 24 小时内有效。</p>
            <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#FE2C55;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">验证邮箱</a></p>
            <p style="margin-top:32px;color:#888;font-size:12px;line-height:1.6">如果按钮无法点击，复制此链接到浏览器：<br><span style="word-break:break-all">${url}</span></p>
            <p style="margin-top:24px;color:#aaa;font-size:12px">如果不是你本人注册的，请忽略此邮件。</p>
          </div>
        `,
      });
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (!resend) {
          // Local dev / unconfigured: just log so the developer can copy the link.
          console.log(`\n[MAGIC LINK for ${email}]\n${url}\n`);
          return;
        }
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Mires <onboarding@resend.dev>",
          to: email,
          subject: "登录 Mires",
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#111">
              <h2 style="margin:0 0 16px;font-weight:800">登录 Mires</h2>
              <p style="margin:0 0 24px;color:#555;line-height:1.6">点击下方按钮完成登录。链接 30 分钟内有效。</p>
              <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#FE2C55;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">点击登录</a></p>
              <p style="margin-top:32px;color:#888;font-size:12px;line-height:1.6">如果按钮无法点击，复制此链接到浏览器：<br><span style="word-break:break-all">${url}</span></p>
              <p style="margin-top:24px;color:#aaa;font-size:12px">如果不是你本人发起的登录，请忽略此邮件。</p>
            </div>
          `,
        });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
