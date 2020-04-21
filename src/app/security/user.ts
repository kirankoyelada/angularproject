export class User {
  UserName: string;
  FirstName: string;
  LastName: string;
  Permissions: string[];
  token?: string;
  expires?: Date;
  refreshToken?: string;
}
