import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    groupId: number;
    groupName: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      groupId: number;
      groupName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    groupId: number;
    groupName: string;
  }
}

