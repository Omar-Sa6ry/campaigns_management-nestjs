import { Module,  } from '@nestjs/common'
import { NotificationService } from './notification.service';
import { firebaseAdminProvider } from './firebaseAdminProvider';

@Module({
  providers: [NotificationService,firebaseAdminProvider],
  exports: [NotificationService], 
})
export class NotificationModule {}
