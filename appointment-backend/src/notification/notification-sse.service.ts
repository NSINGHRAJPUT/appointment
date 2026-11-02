import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Notification } from '@prisma/client';

export type NotificationSseEvent = {
  userId: string;
  notification: Notification;
};

@Injectable()
export class NotificationSseService {
  private readonly subject = new Subject<NotificationSseEvent>();

  emit(userId: string, notification: Notification) {
    this.subject.next({ userId, notification });
  }

  stream(userId: string): Observable<MessageEvent> {
    return this.subject.asObservable().pipe(
      filter((event) => event.userId === userId),
      map(
        (event) =>
          ({
            data: event.notification,
          }) as MessageEvent,
      ),
    );
  }
}
