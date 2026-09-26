import { RequestStatus } from './request-status.enum.js';
import { randomUUID } from 'node:crypto';

export abstract class Request {
  protected readonly id: string;
  protected status: RequestStatus;
  protected readonly createdAt: Date;
  protected passengerId: string | null;

  constructor(passengerId: string | null = null, id?: string) {
    this.id = id ?? randomUUID();
    this.status = RequestStatus.PENDING;
    this.createdAt = new Date();
    this.passengerId = passengerId;
  }

  public getId(): string {
    return this.id;
  }

  public getStatus(): RequestStatus {
    return this.status;
  }

  public setStatus(status: RequestStatus): void {
    this.status = status;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getPassengerId(): string | null {
    return this.passengerId;
  }

  public setPassengerId(passengerId: string | null): void {
    this.passengerId = passengerId;
  }

  public abstract getTargetFloor(): number;
}
