import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './navigation/navigation';
import { ModalContainer } from './components/modal-container/modal-container';
import { ThemeService } from './services';
import { fromEvent, map, merge } from 'rxjs';
import { PowerSyncService } from './services/powersync';
import { SupabaseConnector } from './services/supabase-connector';
import { createBaseLogger, LogLevel } from '@powersync/web';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppError } from './pages/app-error/app-error';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, ModalContainer, AppError],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('nimmit');
  protected readonly isOnline = signal<boolean>(navigator.onLine);

  // Theme wird zentral ueber den ThemeService gesteuert
  private readonly themeService = inject(ThemeService);
  private readonly powerSync = inject(PowerSyncService);
  protected readonly isDarkMode = this.themeService.isDarkMode;

  constructor(
    private supabase: SupabaseConnector,
  ) {}

  protected readonly isPowerSyncReady = toSignal(this.powerSync.ready$, {
    initialValue: false,
  });

  isPowerSyncError() {
    return this.powerSync.error();
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async ngOnInit(): Promise<void> {
    const logger = createBaseLogger();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    logger.useDefaults();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    logger.setLevel(LogLevel.DEBUG);
    this.powerSync.setupPowerSync(this.supabase);

    // Listen for online/offline events to update the app's connectivity status
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      console.log('Connectivity changed. Online:', isOnline);
      this.isOnline.set(isOnline);
      if (isOnline) {
        this.powerSync.connectDb().catch(e => console.error('Error connecting to PowerSync:', e));
      } else {
        this.powerSync.disconnectDb().catch(e => console.error('Error disconnecting from PowerSync:', e));
      }
    });
  }
}
