import { Role } from '../shared/role';

export class User {
  id: string;
  userName: string;
  roles: UserRole[];
  FirstName: string;
  LastName: string;
  Password: string;
  firstName: string;
  lastName: string;
  permissions: string[];
  controlNumber: string;
  location: string;
  customerId: string;
  revealSpaces?: boolean;
  emailID:string;
  associatedCustomerGuids:string[];
}

export class UserRole {
  code: string;
  isPartial: boolean;
}
