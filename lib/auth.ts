import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { query } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.userId) return null;

        const userId = parseInt(credentials.userId as string);
        if (isNaN(userId)) return null;

        // Получаем пользователя и его группы из БД
        const users = await query<{
          id_per: number;
          fio: string;
          group_id: number;
          group_name: string;
        }>(
          `SELECT p.id_per, p.fio, g.id_gr as group_id, g.name as group_name
           FROM person p
           JOIN consist_gr cg ON cg.id_per = p.id_per
           JOIN gr_person g ON g.id_gr = cg.id_gr
           WHERE p.id_per = $1
           LIMIT 1`,
          [userId]
        );

        if (users.length === 0) return null;

        const user = users[0];
        return {
          id: user.id_per.toString(),
          name: user.fio,
          groupId: user.group_id,
          groupName: user.group_name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.groupId = (user as any).groupId;
        token.groupName = (user as any).groupName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).groupId = token.groupId;
        (session.user as any).groupName = token.groupName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});

// Проверка доступа к состоянию
export async function checkStateAccess(
  userId: number,
  templateId: number,
  stateId: number
): Promise<boolean> {
  const result = await query<{ has_access: boolean }>(
    `SELECT EXISTS(
      SELECT 1 FROM access_state a
      JOIN consist_gr cg ON cg.id_gr = a.id_gr
      WHERE cg.id_per = $1 AND a.id_type_pr = $2 AND a.id_state = $3
    ) as has_access`,
    [userId, templateId, stateId]
  );
  return result[0]?.has_access ?? false;
}

