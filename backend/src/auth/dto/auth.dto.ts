export class RegisterDto {
  email!: string;
  password!: string;
  role!: 'BUYER' | 'SUPPLIER';
}

export class LoginDto {
  email!: string;
  password!: string;
}
