import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-offline',
  imports: [RouterLink, TranslocoModule],
  templateUrl: './offline.html',
  styleUrl: './offline.scss',
})
export class Offline {

}
