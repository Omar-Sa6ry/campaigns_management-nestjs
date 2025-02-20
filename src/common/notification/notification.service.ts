import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class NotificationService {
  constructor (
    @Inject('FIREBASE_ADMIN')
    private readonly firebaseAdmin: { defaultApp: any },
  ) {}

  async sendPushNotification (fcmToken: string, title: string, body: string) {
    try {
      await this.firebaseAdmin.defaultApp
        .messaging()
        .send({
          notification: { title, body },
          token: fcmToken,
          data: {},
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
          apns: {
            headers: {
              'apns-priority': '10',
            },
            payload: {
              aps: {
                contentAvailable: true,
                sound: 'default',
              },
            },
          },
        })
        .catch((error: any) => {
          console.error('❌ Firebase Error:', error)
        })
    } catch (error) {
      console.error('❌ Push Notification Error:', error)
      return error
    }
  }
}
