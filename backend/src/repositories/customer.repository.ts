import { BaseRepository } from '../base/base.repository.js';
import { Customer, type ICustomer } from '../models/customer.model.js';
import type { Types } from 'mongoose';

export type CreateCustomerInput = {
  name: string;
  email: string;
  phone?: string;
  createdBy: Types.ObjectId;
};

export type UpdateCustomerInput = Partial<Pick<ICustomer, 'name' | 'email' | 'phone'>>;

export class CustomerRepository extends BaseRepository<ICustomer, CreateCustomerInput, UpdateCustomerInput> {
  constructor() {
    super(Customer);
  }
}

export const customerRepository = new CustomerRepository();
