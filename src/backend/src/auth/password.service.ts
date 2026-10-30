import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> { return argon2.hash(password, { type: argon2.argon2id }); }
  private readonly dummyHash = argon2.hash(randomBytes(32), { type: argon2.argon2id });
  async verify(hash: string | null, password: string): Promise<boolean> {
    try {
      const valid = await argon2.verify(hash ?? await this.dummyHash, password);
      return hash !== null && valid;
    } catch {
      return false;
    }
  }
}
