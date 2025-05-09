import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.domain';

@Injectable()
export class UserFactory {
  createUser(props: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): User {
    return new User({
      email: props.email,
      firstName: props.firstName,
      lastName: props.lastName,
      phone: props.phone,
    });
  }
}
