import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './navigation/navigation';
import { ModalContainer } from './components/modal-container/modal-container';
import { ThemeService } from './services';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, ModalContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('nimmit');
  
  // ThemeService injizieren um es beim App-Start zu initialisieren
  private readonly themeService = inject(ThemeService);
}
