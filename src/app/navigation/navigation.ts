import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, List, Users, Settings, Plus } from 'lucide-angular';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class Navigation {
  // Lucide Icons
  readonly icons = { List, Users, Settings, Plus };

  addNewItem(): void {
    // TODO: Implement add new item modal/page
    console.log('Add new item');
  }
}
