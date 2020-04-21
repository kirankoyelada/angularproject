export interface UserRoles {
  id: string;
  roles: Role[];
}

export interface Role {
  name: string;
}

export class UserDetail {
  id?: string;
  UserName: string;
  FirstName: string;
  LastName: string;
  Permissions: string[];
  token: string;
  tokenExpiration: Date;
  ControlNumber: string;
  Location: string;
  customerId: string;
  revealSpaces?: boolean;
  EmailID: string;
  refreshToken?: string;
}

export class UserInfo {
  username: string;
  password: string;
}
