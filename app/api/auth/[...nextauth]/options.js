// app/api/auth/[...nextauth]/options.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/backend/models/User";
import mongodbConnect from "@/backend/lib/mongodb";
import bcrypt from "bcryptjs";

export const options = {
  providers: [
    CredentialsProvider({
      id: "line",
      name: "LINE",
      credentials: {
        userId: { label: "User ID", type: "text" },
        displayName: { label: "Display Name", type: "text" },
        pictureUrl: { label: "Picture URL", type: "text" },
      },
      async authorize(credentials, req) {
        try {
          await mongodbConnect();

          if (!credentials?.userId) {
            throw new Error("LINE user ID is required");
          }

          let user = await User.findOne({ lineId: credentials.userId });

          if (!user) {
            user = await User.create({
              lineId: credentials.userId,
              name: credentials.displayName || `LINE User ${credentials.userId.slice(0, 4)}`,
              avatar: credentials.pictureUrl || null,
              role: "user",
              isVerified: true,
              lastLogin: new Date(),
            });
          } else {
            user.lastLogin = new Date();
            if (credentials.pictureUrl) user.avatar = credentials.pictureUrl;
            if (credentials.displayName) user.name = credentials.displayName;
            await user.save();
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email || null,
            image: user.avatar,
            lineId: user.lineId,
            role: user.role,
          };
        } catch (error) {
          console.error("LINE authorization error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          await mongodbConnect();

          if (!credentials?.username || !credentials?.password) {
            throw new Error("Username and password are required");
          }

          const user = await User.findOne({
            $or: [{ username: credentials.username }, { email: credentials.username }],
            role: "admin",
          }).select("+password");

          if (!user) throw new Error("Admin user not found");

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) throw new Error("Invalid password");

          user.lastLogin = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.avatar,
          };
        } catch (error) {
          console.error("Admin authorization error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.lineId = user.lineId || null;
        token.name = user.name;
        token.image = user.image || null;
        token.provider = account?.provider || (user.lineId ? "line" : "admin-credentials");
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          role: token.role,
          lineId: token.lineId,
          name: token.name,
          image: token.image,
          provider: token.provider,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
};

export default NextAuth(options);