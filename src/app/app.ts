import { Component, inject, NgZone, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './navigation/navigation';
import { ModalContainer } from './components/modal-container/modal-container';
import { ThemeService } from './services';
import { fromEvent, map, merge } from 'rxjs';
import { PowerSyncService } from './services/powersync';
import { SupabaseConnector } from './services/supabase-connector';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, ModalContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('nimmit');

  // ThemeService injizieren um es beim App-Start zu initialisieren
  private readonly themeService = inject(ThemeService);

  constructor(
    private supabase: SupabaseConnector,
    private readonly powerSync: PowerSyncService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async ngOnInit(): Promise<void> {
    this.powerSync.setupPowerSync(this.supabase);

    // Listen for online/offline events to update the app's connectivity status
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      console.log('Connectivity changed. Online:', isOnline);
      // You can also update a signal here to reflect the connectivity status in the UI
    });
  }
}
